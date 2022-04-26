import * as express from "express"
import * as path from "path"
import { Server } from "socket.io"
import { ServerGameState } from "../shared/model/gamestate"
import * as CONSTANTS from "../shared/constants"
import { Player } from "../shared/model/player"

let gamestate: ServerGameState = new ServerGameState()
setInterval(() => gamestate.progress(), CONSTANTS.SERVER_TIMESTEP)

const app = express()
app.set("port", CONSTANTS.PORT)
const httpServer = require("http").createServer(app)
const io = new Server(httpServer)

app.use(express.static(path.join(__dirname, "../client")))

app.get("/", (req: any, res: any) => {
    res.sendFile(path.resolve("./dist/client/index.html"))
})

app.get("/game", (req: any, res: any) => {
    // :P
    res.redirect(301, "https://www.youtube.com/watch?v=dQw4w9WgXcQ")
})

app.get("/css/style.css", (req: any, res: any) => {
    res.sendFile(path.resolve("./dist/client/css/style.css"))
})

io.on(CONSTANTS.ENDPOINT_CLIENT_CONNECT, function(socket: any) {
    console.log(socket.id, "Client connected!")

    socket.on(CONSTANTS.ENDPOINT_GAME_INIT, function(name: string) {
        if (!(socket.id in gamestate.players)) {
            console.log(socket.id, "Game init")
            gamestate.setPlayer(new Player(socket.id, name))
        }
    })

    socket.on(CONSTANTS.ENDPOINT_SERVER_DISCONNECT, function() {
        console.log(socket.id, "Client disconnected!")
        gamestate.remPlayer(socket.id)
    })

    socket.on(CONSTANTS.ENDPOINT_UPDATE_DIRECTION, function(direction: number) {
        gamestate.updatePlayer(socket.id, direction)
    })

    socket.on(CONSTANTS.ENDPOINT_UPDATE_SPEED, function(speed: number) {
        gamestate.players[socket.id].x = speed
    })

    setInterval(
        function() {
            socket.emit(CONSTANTS.ENDPOINT_UPDATE_GAME_STATE, gamestate.exportState(socket.id))
        },
        CONSTANTS.SERVER_TIMESTEP
    )
})

httpServer.listen(CONSTANTS.PORT, function() {
    console.log("listening")
})


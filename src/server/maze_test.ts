import * as express from "express"
import * as path from "path"
import { Server } from "socket.io"
import { createServer } from "http"
import { ServerGameState } from "../shared/model/gamestate"
import * as CONSTANTS from "../shared/constants"
import { validName } from "../shared/utilities"

let gamestate: ServerGameState = new ServerGameState()
setInterval(() => gamestate.update(), CONSTANTS.SERVER_UPDATE_RATE)

const app = express()
app.set("port", CONSTANTS.PORT)
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

const httpServer = createServer(app)
httpServer.listen(CONSTANTS.PORT, function() {
    console.log(new Date().toLocaleTimeString(), "listening")
})

const io = new Server(httpServer)

io.on(CONSTANTS.ENDPOINT_CLIENT_CONNECT, function(socket: any) {
    console.log(new Date().toLocaleTimeString(), socket.id, "Client connected!")

    gamestate.playerJoin(socket.id)
    socket.on(CONSTANTS.ENDPOINT_GAME_INIT, function(name: string) {
        gamestate = new ServerGameState()
    })
    setInterval(
        function() {
            socket.emit(CONSTANTS.ENDPOINT_UPDATE_GAME_STATE, gamestate.exportState(socket.id))
        },
        CONSTANTS.SERVER_TICK_RATE
    )
})
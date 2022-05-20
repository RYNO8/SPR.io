import * as express from "express"
import * as path from "path"
import { Server } from "socket.io"
import { createServer } from "http"
import * as dotenv from "dotenv"

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

import { ServerGameState } from "../shared/model/server_gamestate"
import * as CONSTANTS from "../shared/constants"
import { validName, validNumber } from "../shared/utilities"

let gamestate: ServerGameState = new ServerGameState()

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
app.get("/img/ducc.svg", (req: any, res: any) => {
    res.sendFile(path.resolve("./dist/client/img/ducc.svg"))
})
app.get("/js/jquery.ripples.js", (req: any, res: any) => {
    res.sendFile(path.resolve("./dist/client/js/jquery.ripples.js"))
})

const httpServer = createServer(app)
httpServer.listen(CONSTANTS.PORT, function() {
    console.log(new Date().toLocaleTimeString(), "listening")
})

const io = new Server(httpServer)

io.on(CONSTANTS.Endpoint.CLIENT_CONNECT, function(socket: any) {
    console.log(new Date().toLocaleTimeString(), socket.id, "Client connected!")

    socket.on(CONSTANTS.Endpoint.GAME_INIT, function(name: string) {
        if (!(socket.id in gamestate.players) && validName(name)) {
            console.log(new Date().toLocaleTimeString(), socket.id, "Game init")
            gamestate.playerEnter(socket.id, name, false)
        }
    })

    socket.on(CONSTANTS.Endpoint.SERVER_DISCONNECT, function() {
        console.log(new Date().toLocaleTimeString(), socket.id, "Client disconnected!")
        gamestate.playerExit(socket.id)
    })

    socket.on(CONSTANTS.Endpoint.RESET, function() {
        gamestate.playerExit(socket.id)
    })

    socket.on(CONSTANTS.Endpoint.UPDATE_DIRECTION, function(direction: number) {
        if (validNumber(direction)) {
            gamestate.setPlayerDirection(socket.id, direction)
        }
    })

    socket.on(CONSTANTS.Endpoint.UPDATE_SPEED, function(speed: number) {
        gamestate.players[socket.id].centroid.x = speed
    })

    setInterval(
        function() {
            socket.emit(CONSTANTS.Endpoint.UPDATE_GAME_STATE, gamestate.exportState(socket.id))
        },
        CONSTANTS.SERVER_TICK_RATE
    )
})

setInterval(
    function() {
        io.emit(CONSTANTS.Endpoint.UPDATE_LEADERBOARD, gamestate.exportLeaderboard())
    },
    CONSTANTS.LEADERBOARD_UPDATE_RATE
)
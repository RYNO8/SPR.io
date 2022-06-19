import * as dotenv from "dotenv"

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

import * as express from "express"
import * as path from "path"
import { Server } from "socket.io"
import { createServer } from "http"

import * as CONSTANTS from "../shared/constants"
import { Rooms } from "./room_management";
import { MazeDynamic } from "./mazedynamic";

const rooms = new Rooms(MazeDynamic)

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
httpServer.listen(CONSTANTS.PORT, function () {
    console.log(new Date().toLocaleTimeString(), "listening")
})

const io = new Server(httpServer)

function prettyDate() {
    return new Date().toLocaleTimeString()
}

io.on(CONSTANTS.Endpoint.CLIENT_CONNECT, function (socket: any) {
    console.log(prettyDate(), socket.id, "Client connected!")
    let roomID = rooms.joinRoom()

    const exportState = setInterval(
        function () {
            socket.emit(CONSTANTS.Endpoint.UPDATE_GAME_STATE, rooms.getRoom(roomID).exportState(socket.id))
        },
        CONSTANTS.SERVER_TICK_RATE
    )

    const exportLeaderboard = setInterval(
        function () {
            io.emit(CONSTANTS.Endpoint.UPDATE_LEADERBOARD, rooms.getRoom(roomID).exportLeaderboard())
        },
        CONSTANTS.LEADERBOARD_UPDATE_RATE
    )

    socket.on(CONSTANTS.Endpoint.GAME_INIT, function (name: string) {
        let newRoomID = rooms.joinRoom()
        rooms.leaveRoom(roomID)
        roomID = newRoomID
        
        if (rooms.getRoom(roomID).playerEnter(socket.id, name, false)) {
            console.log(prettyDate(), socket.id, "Game init")
        }
    })

    socket.on(CONSTANTS.Endpoint.SERVER_DISCONNECT, function () {
        console.log(prettyDate(), socket.id, "Client disconnected!")
        clearInterval(exportState)
        clearInterval(exportLeaderboard)
        rooms.getRoom(roomID).playerExit(socket.id)
        rooms.leaveRoom(roomID)
    })

    socket.on(CONSTANTS.Endpoint.RESET, function () {
        rooms.getRoom(roomID).playerExit(socket.id)
    })

    socket.on(CONSTANTS.Endpoint.UPDATE_DIRECTION, function (direction: number) {
        rooms.getRoom(roomID).setPlayerDirection(socket.id, direction)
    })

    socket.on(CONSTANTS.Endpoint.UPDATE_SPEED, function (speed: number) {
        rooms.getRoom(roomID).players.get(socket.id).centroid.x = speed
    })
})
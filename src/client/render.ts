import { socket } from "./networking"
import { ClientGameState } from "../shared/model/client_gamestate"
import * as CONSTANTS from "../shared/constants"
import { Player } from "../shared/model/player"
import { direction } from "./playerInput"
import { Powerup } from "../shared/model/powerup"
import { initGameoverMenu, initDisconnectedMenu } from "./events"
import { RollingAvg } from "../shared/utilities"
import { Obstacle } from "../shared/model/obstacle"

let targetStates: ClientGameState[] = []
let gamestate = new ClientGameState(Date.now(), null, null, [], [], [])
let score: number = 0
let isInGame: boolean = false
let framerateSamples = new RollingAvg(CONSTANTS.SAMPLE_SIZE, 1)
let timeDiff = new RollingAvg(CONSTANTS.SAMPLE_SIZE, 0)
let latencySamples = new RollingAvg(CONSTANTS.SAMPLE_SIZE, 0)

const debug1 = document.getElementById("debug-1")
const debug2 = document.getElementById("debug-2")
const debug3 = document.getElementById("debug-3")
const menu = document.getElementById("menu")
const gameoverMenu = document.getElementById("gameover-menu")
const canvas = <HTMLCanvasElement> document.getElementById("game-canvas")
const context: CanvasRenderingContext2D = canvas.getContext("2d")

function serverTime() {
    return Date.now() + timeDiff.getAvg() - CONSTANTS.RENDER_DELAY
}

socket.on(CONSTANTS.Endpoint.UPDATE_GAME_STATE, function(jsonstate: any) {
    let newGamestate: ClientGameState = new ClientGameState(
        jsonstate.time,
        jsonstate.attackerName,
        jsonstate.me,
        jsonstate.others,
        jsonstate.powerups,
        jsonstate.maze
    )

    timeDiff.update(newGamestate.time - Date.now())
    latencySamples.update(Date.now())
    //if (!targetStates.isEmpty()) console.log(targetStates.front().time - newGamestate.time)
    targetStates.push(newGamestate)
})

// modify gamestate towards targetState
function updateGamestate() {
    while (targetStates.length > 0 && targetStates[0].time < serverTime()) {
        //console.log(targetStates.length, targetStates[0].time - serverTime())
        targetStates.shift()
    }
    if (targetStates.length == 0) {
        //console.log("empty!")
        return
    }
    let targetState: ClientGameState = targetStates[0]

    framerateSamples.update(Date.now())
    let framerate = 1 / framerateSamples.getDiff()
    gamestate.update(targetState, framerate)
}

export function render() {
    debug1.innerText = latencySamples.getDiff().toString()
    debug2.innerText = timeDiff.getAvg().toString()
    debug3.innerText = framerateSamples.getDiff().toString()

    updateGamestate()

    context.restore()
    context.save()
    context.font = CONSTANTS.CANVAS_FONT
    context.lineJoin = "round"

    renderUnreachable()

    if (isInGame && !socket.id) {
        // disconnected
        initDisconnectedMenu("Your bad internet connection", score)
        isInGame = false
        score = 0
        requestAnimationFrame(render)
        return
    } else if (isInGame && gamestate.attackerName) {
        // died
        initGameoverMenu(gamestate.attackerName, score)
        isInGame = false
        score = 0
        requestAnimationFrame(render)
        return
    } else if (!gamestate.me) {
        // stuff hasnt initialised yet, wait some more
        isInGame = false
        score = 0
        requestAnimationFrame(render)
        return
    } else if (!gamestate.me.isVisible) {
        // nobody in the map OR looking at wall
        isInGame = false
        score = 0
    } else if (gamestate.me.id == socket.id) {
        // nothing bad happened yet!
        menu.classList.remove("slide-in")
        menu.classList.add("slide-out")
        gameoverMenu.classList.remove("slide-in")
        gameoverMenu.classList.add("slide-out")

        console.assert(gamestate.me.score >= score)
        isInGame = true
        score = gamestate.me.score
        gamestate.me.direction = direction
    }

    if (true) {
        let size: number = Math.max(canvas.width / CONSTANTS.VISIBLE_WIDTH, canvas.height / CONSTANTS.VISIBLE_HEIGHT)
        context.translate(canvas.width / 2, canvas.height / 2)
        context.scale(size, size)
        context.translate(-gamestate.me.centroid.x, -gamestate.me.centroid.y)
    } else {
        let size: number = Math.min(canvas.width, canvas.height) / CONSTANTS.MAP_SIZE
        context.translate((canvas.width - size * CONSTANTS.MAP_SIZE) / 2, (canvas.height - size * CONSTANTS.MAP_SIZE) / 2)
        context.scale(size, size)
    }

    renderBackround()
    //renderShadow(gamestate.maze)
    renderMap()
    renderMaze(gamestate.maze)
    for (let i in gamestate.powerups) {
        renderPowerup(gamestate.powerups[i])
    }
    for (let i in gamestate.others) {
        renderPlayer(gamestate.others[i], gamestate.others[i].getColour(gamestate.me))
    }
    if (gamestate.me.isVisible) {
        renderPlayer(gamestate.me, gamestate.me.getColour(gamestate.me))
    }

    // Rerun this render function on the next frame
    requestAnimationFrame(render)
}

function renderUnreachable() {
    // clear all from previous render
    context.clearRect(0, 0, canvas.width, canvas.height)

    // background
    context.fillStyle = CONSTANTS.MAP_UNREACHABLE_COLOUR
    context.fillRect(0, 0, canvas.width, canvas.height)
}

function renderBackround() {
    context.fillStyle = CONSTANTS.MAP_BACKGROUND_COLOUR
    context.fillRect(0, 0, CONSTANTS.MAP_SIZE, CONSTANTS.MAP_SIZE)
}

function renderMap() {
    if (CONSTANTS.MAP_STYLE == "grid") {
        for (let x = 0; x <= CONSTANTS.MAP_SIZE; x += CONSTANTS.CELL_SIZE) {
            context.strokeStyle = CONSTANTS.MAP_LINE_COLOUR
            context.lineWidth = CONSTANTS.MAP_LINE_WIDTH
            context.beginPath()
            context.moveTo(x, 0)
            context.lineTo(x, CONSTANTS.MAP_SIZE)
            context.stroke()
        }
        for (let y = 0; y <= CONSTANTS.MAP_SIZE; y += CONSTANTS.CELL_SIZE) {
            context.strokeStyle = CONSTANTS.MAP_LINE_COLOUR
            context.lineWidth = CONSTANTS.MAP_LINE_WIDTH
            context.beginPath()
            context.moveTo(0, y)
            context.lineTo(CONSTANTS.MAP_SIZE, y)
            context.stroke()
        }
    } else if (CONSTANTS.MAP_STYLE == "dots") {
        for (let x = CONSTANTS.CELL_SIZE; x < CONSTANTS.MAP_SIZE; x += CONSTANTS.CELL_SIZE) {
            for (let y = CONSTANTS.CELL_SIZE; y < CONSTANTS.MAP_SIZE; y += CONSTANTS.CELL_SIZE) {
                context.fillStyle = CONSTANTS.MAP_LINE_COLOUR
                context.fillRect(x - 2, y - 2, 4, 4)
            }
        }
    }
}

function drawInset(inset: number, strokeStyle: string) {
    context.strokeStyle = strokeStyle
    context.lineWidth = 2 * CONSTANTS.MAP_SIZE
    context.strokeRect(-CONSTANTS.MAP_SIZE + inset, -CONSTANTS.MAP_SIZE + inset, 3 * CONSTANTS.MAP_SIZE - 2 * inset, 3 * CONSTANTS.MAP_SIZE - 2 * inset)
}

function renderMaze(maze: Obstacle[]) {
    drawInset(2 * CONSTANTS.MAZE_OVERLAP, CONSTANTS.MAP_SHADOW_COLOUR)

    
    let existingMaze = maze.filter(function(val : Obstacle) {
        return val.time <= serverTime()
    })
    let newMaze = maze.filter(function(val : Obstacle) {
        return val.time > serverTime()
    })
    for (let i in existingMaze) {
        context.strokeStyle = CONSTANTS.MAP_SHADOW_COLOUR
        context.lineWidth = 2 * CONSTANTS.MAP_SHADOW_WIDTH
        context.beginPath()
        for (let j in existingMaze[i].points) {
            context.lineTo(existingMaze[i].points[j].x, existingMaze[i].points[j].y)
        }
        context.lineTo(existingMaze[i].points[0].x, existingMaze[i].points[0].y)
        context.lineTo(existingMaze[i].points[1].x, existingMaze[i].points[1].y)
        context.stroke()
    }
    for (let i in existingMaze) {
        context.fillStyle = CONSTANTS.MAP_UNREACHABLE_COLOUR
        context.beginPath()
        for (let j in existingMaze[i].points) {
            context.lineTo(existingMaze[i].points[j].x, existingMaze[i].points[j].y)
        }
        // TODO: handle 0 width gaps
        context.lineTo(existingMaze[i].points[0].x, existingMaze[i].points[0].y)
        context.lineTo(existingMaze[i].points[1].x, existingMaze[i].points[1].y)
        context.fill()
    }
    for (let i in newMaze) {
        context.fillStyle = CONSTANTS.MAP_WARNING_COLOUR
        context.beginPath()
        for (let j in newMaze[i].points) {
            context.lineTo(newMaze[i].points[j].x, newMaze[i].points[j].y)
        }
        // TODO: handle 0 width gaps
        context.lineTo(newMaze[i].points[0].x, newMaze[i].points[0].y)
        context.lineTo(newMaze[i].points[1].x, newMaze[i].points[1].y)
        context.fill()
    }

    drawInset(CONSTANTS.MAZE_OVERLAP, CONSTANTS.MAP_UNREACHABLE_COLOUR)
}

function renderPowerup(powerup: Powerup) {
    context.fillStyle = CONSTANTS.POWERUP_COLOUR
    context.beginPath()
    context.arc(powerup.centroid.x, powerup.centroid.y, CONSTANTS.POWERUP_RADIUS, 0, 2 * Math.PI)
    context.fill()
}

function renderPlayer(player: Player, colour: string) {
    context.save()

    context.translate(player.centroid.x, player.centroid.y)
    context.rotate(player.direction)
    if (player.hasPowerup >= serverTime()) {
        // TODO: change intensity of colour
        context.fillStyle = CONSTANTS.PLAYER_POWERUP_COLOUR
        //console.log("purple", player.hasPowerup - serverTime())
    } else {
        context.fillStyle = CONSTANTS.PLAYER_DEFAULT_COLOUR
    }
    context.strokeStyle = colour
    context.lineWidth = CONSTANTS.PLAYER_LINE_WIDTH

    context.beginPath()
    let innerRadius: number = CONSTANTS.PLAYER_RADIUS - CONSTANTS.PLAYER_LINE_WIDTH
    context.rect(-innerRadius, -innerRadius, 2 * innerRadius, 2 * innerRadius)
    context.fill()
    context.stroke()

    context.rotate(-player.direction)
    context.fillStyle = CONSTANTS.PLAYER_DEFAULT_COLOUR
    context.font = CONSTANTS.CANVAS_FONT
    context.textAlign = "center"
    context.fillText(player.name, 0, CONSTANTS.PLAYER_NAME_OFFSET)

    context.restore()
}

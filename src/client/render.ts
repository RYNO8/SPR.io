import { socket } from "./networking"
import { ClientGameState } from "../shared/model/gamestate"
import * as CONSTANTS from "../shared/constants"
import { Player } from "../shared/model/player"
import { direction } from "./playerInput"
import { Powerup } from "../shared/model/powerup"
import { initGameoverMenu, initDisconnectedMenu } from "./events"
import { RollingAvg } from "../shared/utilities"
import { Obstacle } from "../shared/model/obstacle"

let targetStates: ClientGameState[] = []
let gamestate = new ClientGameState(0, null, [], [], [])
let isInGame = false
let score: number = 0
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

socket.on(CONSTANTS.ENDPOINT_UPDATE_GAME_STATE, function(jsonstate: any) {
    let newGamestate: ClientGameState = new ClientGameState(
        jsonstate.time,
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

    if (!socket.id) {
        if (isInGame) {
            // disconnected
            initDisconnectedMenu("Your bad internet connection", score)
            isInGame = false
            score = 0
        }
    } else if (gamestate.me && gamestate.me.id != socket.id) {
        if (isInGame) {
            initGameoverMenu(gamestate.me.name, score)
            isInGame = false
            score = 0
        }
    } else if (gamestate.me) {
        menu.classList.remove("slide-in")
        menu.classList.add("slide-out")
        gameoverMenu.classList.remove("slide-in")
        gameoverMenu.classList.add("slide-out")

        isInGame = true
        console.assert(gamestate.me.score >= score)
        score = gamestate.me.score
        gamestate.me.direction = direction
    }

    if (gamestate.me && !process.env.MAPVIEWTEST) {
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
    if (gamestate.me) {
        renderPlayer(gamestate.me, CONSTANTS.PLAYER_TEAMMATE_COLOUR)
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

// TODO
/*function renderShadow(maze : [number, number][]) {
    context.strokeStyle = CONSTANTS.MAP_SHADOW_COLOUR
    context.lineWidth = CONSTANTS.MAP_SHADOW_WIDTH
    context.strokeRect(CONSTANTS.MAP_SHADOW_WIDTH / 2, CONSTANTS.MAP_SHADOW_WIDTH / 2, CONSTANTS.MAP_SIZE - CONSTANTS.MAP_SHADOW_WIDTH, CONSTANTS.MAP_SIZE - CONSTANTS.MAP_SHADOW_WIDTH)

    context.fillStyle = CONSTANTS.MAP_SHADOW_COLOUR
    for (let i in maze) {
        context.fillRect(maze[i][0] - CONSTANTS.MAP_SHADOW_WIDTH, maze[i][1] - CONSTANTS.MAP_SHADOW_WIDTH, CONSTANTS.CELL_SIZE + 2 * CONSTANTS.MAP_SHADOW_WIDTH, CONSTANTS.CELL_SIZE + 2 * CONSTANTS.MAP_SHADOW_WIDTH)
    }
}*/

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

function renderMaze(maze: Obstacle[]) {
    context.strokeStyle = CONSTANTS.MAP_SHADOW_COLOUR
    context.lineWidth = CONSTANTS.MAP_SHADOW_WIDTH
    context.strokeRect(CONSTANTS.MAP_SHADOW_WIDTH / 2, CONSTANTS.MAP_SHADOW_WIDTH / 2, CONSTANTS.MAP_SIZE - CONSTANTS.MAP_SHADOW_WIDTH, CONSTANTS.MAP_SIZE - CONSTANTS.MAP_SHADOW_WIDTH)

    context.fillStyle = CONSTANTS.MAP_UNREACHABLE_COLOUR
    for (let i in maze) {
        context.strokeStyle = CONSTANTS.MAP_SHADOW_COLOUR
        context.lineWidth = 2 * CONSTANTS.MAP_SHADOW_WIDTH
        context.beginPath()
        for (let j in maze[i].points) {
            context.lineTo(maze[i].points[j].x, maze[i].points[j].y)
        }
        context.lineTo(maze[i].points[0].x, maze[i].points[0].y)
        context.lineTo(maze[i].points[1].x, maze[i].points[1].y)
        context.stroke()
    }
    for (let i in maze) {
        context.fillStyle = CONSTANTS.MAP_UNREACHABLE_COLOUR
        context.beginPath()
        for (let j in maze[i].points) {
            context.lineTo(maze[i].points[j].x, maze[i].points[j].y)
        }
        // TODO: handle 0 width gaps
        context.lineTo(maze[i].points[0].x, maze[i].points[0].y)
        context.lineTo(maze[i].points[1].x, maze[i].points[1].y)
        context.fill()
    }

    context.strokeStyle = CONSTANTS.MAP_UNREACHABLE_COLOUR
    context.lineWidth = CONSTANTS.MAP_SHADOW_WIDTH
    context.strokeRect(-CONSTANTS.MAP_SHADOW_WIDTH / 2, -CONSTANTS.MAP_SHADOW_WIDTH / 2, CONSTANTS.MAP_SIZE + CONSTANTS.MAP_SHADOW_WIDTH, CONSTANTS.MAP_SIZE + CONSTANTS.MAP_SHADOW_WIDTH)
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

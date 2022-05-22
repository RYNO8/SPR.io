import { ClientGameState } from "./client_gamestate"
import * as CONSTANTS from "../shared/constants"
import { clamp } from "../shared/utilities"
import { Obstacle } from "../shared/model/obstacle"
import { Powerup } from "../shared/model/powerup"
import { Player } from "../shared/model/player"

const canvasMain = <HTMLCanvasElement> document.getElementById("canvas-main")
const ctxMain: CanvasRenderingContext2D = canvasMain.getContext("2d")

let ducc = new Image()
ducc.src = "/img/ducc.svg"

export function renderMain(gamestate: ClientGameState) {
    let size = Math.max(canvasMain.width / CONSTANTS.VISIBLE_WIDTH, canvasMain.height / CONSTANTS.VISIBLE_HEIGHT)
    ctxMain.translate(canvasMain.width / 2, canvasMain.height / 2)
    ctxMain.scale(size, size)
    ctxMain.translate(-gamestate.me.centroid.x, -gamestate.me.centroid.y)

    renderMap()
    renderMaze(gamestate.maze, gamestate.time)
    /*for (let i in gamestate.powerups) {
        renderPowerup(gamestate.powerups[i])
    }*/
    for (let i in gamestate.others) {
        renderPlayer(gamestate.others[i], gamestate.time, gamestate.others[i].getColour(gamestate.me))
    }
    if (gamestate.me.isVisible) {
        renderPlayer(gamestate.me, gamestate.time, gamestate.me.getColour(gamestate.me))
    }
}

export function renderUnreachable() {
    ctxMain.restore()
    ctxMain.save()
    ctxMain.font = CONSTANTS.CANVAS_FONT
    ctxMain.lineJoin = "round"

    // clear all from previous render
    ctxMain.clearRect(0, 0, canvasMain.width, canvasMain.height)
}

function renderMap() {
    if (CONSTANTS.MAP_STYLE === "grid") {
        for (let x = 0; x <= CONSTANTS.MAP_SIZE; x += CONSTANTS.CELL_SIZE) {
            ctxMain.strokeStyle = CONSTANTS.MAP_LINE_COLOUR
            ctxMain.lineWidth = CONSTANTS.MAP_LINE_WIDTH
            ctxMain.beginPath()
            ctxMain.moveTo(x, 0)
            ctxMain.lineTo(x, CONSTANTS.MAP_SIZE)
            ctxMain.stroke()
        }
        for (let y = 0; y <= CONSTANTS.MAP_SIZE; y += CONSTANTS.CELL_SIZE) {
            ctxMain.strokeStyle = CONSTANTS.MAP_LINE_COLOUR
            ctxMain.lineWidth = CONSTANTS.MAP_LINE_WIDTH
            ctxMain.beginPath()
            ctxMain.moveTo(0, y)
            ctxMain.lineTo(CONSTANTS.MAP_SIZE, y)
            ctxMain.stroke()
        }
    } else if (CONSTANTS.MAP_STYLE === "dots") {
        for (let x = CONSTANTS.CELL_SIZE; x < CONSTANTS.MAP_SIZE; x += CONSTANTS.CELL_SIZE) {
            for (let y = CONSTANTS.CELL_SIZE; y < CONSTANTS.MAP_SIZE; y += CONSTANTS.CELL_SIZE) {
                ctxMain.fillStyle = CONSTANTS.MAP_LINE_COLOUR
                ctxMain.fillRect(x - 2, y - 2, 4, 4)
            }
        }
    }
}

function drawInset(inset: number, strokeStyle: string) {
    ctxMain.strokeStyle = strokeStyle
    ctxMain.lineWidth = 2 * CONSTANTS.MAP_SIZE
    ctxMain.strokeRect(-CONSTANTS.MAP_SIZE + inset, -CONSTANTS.MAP_SIZE + inset, 3 * CONSTANTS.MAP_SIZE - 2 * inset, 3 * CONSTANTS.MAP_SIZE - 2 * inset)
}

function renderMaze(maze: Obstacle[], time: number) {
    drawInset(CONSTANTS.MAZE_OVERLAP, CONSTANTS.MAP_SHADOW_COLOUR_2)
    //drawInset(CONSTANTS.MAZE_OVERLAP / 2, CONSTANTS.MAP_SHADOW_COLOUR_1)

    ctxMain.strokeStyle = CONSTANTS.MAP_SHADOW_COLOUR_2
    ctxMain.lineWidth = 2 * CONSTANTS.MAP_SHADOW_WIDTH
    renderMazeHelper(maze, time, true)

    /*ctxMain.strokeStyle = CONSTANTS.MAP_SHADOW_COLOUR_1
    ctxMain.lineWidth = CONSTANTS.MAP_SHADOW_WIDTH
    renderMazeHelper(maze, time, true)*/

    ctxMain.fillStyle = CONSTANTS.MAP_UNREACHABLE_COLOUR
    renderMazeHelper(maze, time, false)

    ctxMain.globalAlpha = 1

    drawInset(CONSTANTS.MAZE_OVERLAP / 2, CONSTANTS.MAP_UNREACHABLE_COLOUR)
}

function renderMazeHelper(maze: Obstacle[], time: number, doStroke: boolean) {
    for (let i in maze) {
        //console.assert(maze[i].startTime <= maze[i].endTime)
        let opacity = clamp(Math.min(
            1 + (time - maze[i].startTime) / CONSTANTS.MAZE_CHANGE_DELAY, 
            (maze[i].endTime - time) / CONSTANTS.MAZE_CHANGE_DELAY
        ))
        ctxMain.globalAlpha = opacity

        ctxMain.beginPath()
        for (let j in maze[i].points) {
            ctxMain.lineTo(maze[i].points[j].x, maze[i].points[j].y)
        }
        ctxMain.lineTo(maze[i].points[0].x, maze[i].points[0].y)
        ctxMain.lineTo(maze[i].points[1].x, maze[i].points[1].y)
        if (doStroke) ctxMain.stroke()
        else ctxMain.fill()
    }
}

/*function renderPowerup(powerup: Powerup) {
    ctxMain.fillStyle = CONSTANTS.POWERUP_COLOUR
    ctxMain.beginPath()
    ctxMain.arc(powerup.centroid.x, powerup.centroid.y, CONSTANTS.POWERUP_RADIUS, 0, 2 * Math.PI)
    ctxMain.fill()
}*/

function renderPlayer(player: Player, time: number, colour: string) {
    ctxMain.save()

    ctxMain.translate(player.centroid.x, player.centroid.y)
    ctxMain.rotate(player.direction)
    if (player.hasPowerup >= time) {
        // TODO: change intensity of colour
        ctxMain.fillStyle = CONSTANTS.PLAYER_POWERUP_COLOUR
        //console.log("purple", player.hasPowerup - serverTime())
    } else {
        ctxMain.fillStyle = CONSTANTS.PLAYER_DEFAULT_COLOUR
    }
    ctxMain.strokeStyle = colour
    ctxMain.lineWidth = CONSTANTS.PLAYER_LINE_WIDTH

    // TODO: better ducc
    ctxMain.rotate(Math.PI / 2)
    ctxMain.scale(0.6, 0.6)
    ctxMain.drawImage(ducc, -123, -136)
    ctxMain.rotate(-Math.PI / 2)
    ctxMain.scale(1/0.6, 1/0.6)

    ctxMain.rotate(-player.direction)
    ctxMain.fillStyle = CONSTANTS.PLAYER_DEFAULT_COLOUR
    ctxMain.font = CONSTANTS.CANVAS_FONT
    ctxMain.textAlign = "center"
    ctxMain.fillText(player.name, 0, CONSTANTS.PLAYER_NAME_OFFSET)

    ctxMain.restore()
}
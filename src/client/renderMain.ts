import { ClientGameState } from "./client_gamestate"
import * as CONSTANTS from "../shared/constants"
import { clamp } from "../shared/utilities"
import { Obstacle } from "../shared/model/obstacle"
import { Player } from "../shared/model/player"

const canvasMain = <HTMLCanvasElement> document.getElementById("canvas-main")
const ctxMain: CanvasRenderingContext2D = canvasMain.getContext("2d")

let ducc = new Image()
ducc.src = "/img/ducc.svg"

export function renderMain(gamestate: ClientGameState) {
    ctxMain.restore()
    ctxMain.save()
    ctxMain.clearRect(-CONSTANTS.MAP_SIZE, -CONSTANTS.MAP_SIZE, 3 * CONSTANTS.MAP_SIZE, 3 * CONSTANTS.MAP_SIZE)
    ctxMain.translate(-gamestate.me.centroid.x, -gamestate.me.centroid.y)

    renderMap()
    renderMaze(gamestate.maze, gamestate.time)
    /*for (let powerup of gamestate.powerups) {
        renderPowerup(powerup)
    }*/
    for (let other of gamestate.others) {
        renderPlayer(other, gamestate.time, other.getColour(gamestate.me))
    }
    if (gamestate.me.isVisible) {
        renderPlayer(gamestate.me, gamestate.time, gamestate.me.getColour(gamestate.me))
    }
}

export function renderUnreachable() {

    // clear all from previous render
    
}

function renderMap() {
    if (CONSTANTS.MAP_STYLE === "grid") {
        ctxMain.strokeStyle = CONSTANTS.MAP_LINE_COLOUR
        ctxMain.lineWidth = CONSTANTS.MAP_LINE_WIDTH
        for (let x = 0; x <= CONSTANTS.MAP_SIZE; x += CONSTANTS.CELL_SIZE) {
            ctxMain.beginPath()
            ctxMain.moveTo(x, 0)
            ctxMain.lineTo(x, CONSTANTS.MAP_SIZE)
            ctxMain.stroke()
        }
        for (let y = 0; y <= CONSTANTS.MAP_SIZE; y += CONSTANTS.CELL_SIZE) {
            ctxMain.beginPath()
            ctxMain.moveTo(0, y)
            ctxMain.lineTo(CONSTANTS.MAP_SIZE, y)
            ctxMain.stroke()
        }
    } else if (CONSTANTS.MAP_STYLE === "dots") {
        ctxMain.fillStyle = CONSTANTS.MAP_LINE_COLOUR
        for (let x = CONSTANTS.CELL_SIZE; x < CONSTANTS.MAP_SIZE; x += CONSTANTS.CELL_SIZE) {
            for (let y = CONSTANTS.CELL_SIZE; y < CONSTANTS.MAP_SIZE; y += CONSTANTS.CELL_SIZE) {
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
    //console.log(maze)
    
    drawInset(CONSTANTS.MAP_SHADOW_WIDTH * 2, CONSTANTS.MAP_SHADOW_COLOUR_1)
    drawInset(CONSTANTS.MAP_SHADOW_WIDTH, CONSTANTS.MAP_SHADOW_COLOUR_2)

    ctxMain.strokeStyle = CONSTANTS.MAP_SHADOW_COLOUR_1
    ctxMain.lineWidth = CONSTANTS.MAP_SHADOW_WIDTH * 4
    renderMazeHelper(maze, time, true)

    ctxMain.strokeStyle = CONSTANTS.MAP_SHADOW_COLOUR_2
    ctxMain.lineWidth = CONSTANTS.MAP_SHADOW_WIDTH * 2
    renderMazeHelper(maze, time, true)

    ctxMain.fillStyle = CONSTANTS.MAP_UNREACHABLE_COLOUR
    renderMazeHelper(maze, time, false)

    drawInset(CONSTANTS.MAZE_OVERLAP / 2, CONSTANTS.MAP_UNREACHABLE_COLOUR)
}

function renderMazeHelper(maze: Obstacle[], time: number, doStroke: boolean) {
    for (let val of maze) {
        //console.assert(val.startTime <= val.endTime)
        let opacity = clamp(Math.min(
            1 + (time - val.startTime) / CONSTANTS.MAZE_CHANGE_DELAY, 
            (val.endTime - time) / CONSTANTS.MAZE_CHANGE_DELAY
        ))
        ctxMain.globalAlpha = opacity

        ctxMain.beginPath()
        for (let point of val.points) {
            ctxMain.lineTo(point.x, point.y)
        }
        ctxMain.lineTo(val.points[0].x, val.points[0].y)
        ctxMain.lineTo(val.points[1].x, val.points[1].y)
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

/*function renderPlayer(player: Player, time: number, colour: string) {
    // TODO: better ducc
    ctxMain.translate(player.centroid.x, player.centroid.y)
    ctxMain.rotate(player.direction + Math.PI / 2)
    ctxMain.scale(0.6, 0.6)
    ctxMain.drawImage(ducc, -123, -136)
    ctxMain.rotate(-player.direction - Math.PI / 2)
    ctxMain.scale(1/0.6, 1/0.6)
    
    ctxMain.fillStyle = CONSTANTS.PLAYER_DEFAULT_COLOUR
    ctxMain.textAlign = "center"
    ctxMain.fillText(player.name, 0, CONSTANTS.PLAYER_NAME_OFFSET)

    ctxMain.translate(-player.centroid.x, -player.centroid.y)
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

    ctxMain.beginPath()
    let innerRadius: number = CONSTANTS.PLAYER_RADIUS - CONSTANTS.PLAYER_LINE_WIDTH
    ctxMain.rect(-innerRadius, -innerRadius, 2 * innerRadius, 2 * innerRadius)
    ctxMain.fill()
    ctxMain.stroke()
    //ctxMain.drawImage(ducc, -138, -96)
    //ctxMain.fillRect(0, -2, 50, 2)

    ctxMain.rotate(-player.direction)
    ctxMain.fillStyle = CONSTANTS.PLAYER_DEFAULT_COLOUR
    ctxMain.font = CONSTANTS.CANVAS_FONT
    ctxMain.textAlign = "center"
    ctxMain.fillText(player.name, 0, CONSTANTS.PLAYER_NAME_OFFSET)

    ctxMain.restore()
}
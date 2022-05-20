import * as CONSTANTS from "../shared/constants"
import { Obstacle } from "../shared/model/obstacle"
import { ClientGameState } from "../shared/model/client_gamestate"
import { Powerup } from "../shared/model/powerup"
import { Player } from "../shared/model/player"

const canvasMain = <HTMLCanvasElement> document.getElementById("canvas-main")
const ctxMain: CanvasRenderingContext2D = canvasMain.getContext("2d")

export function renderMain(gamestate: ClientGameState) {
    let size = Math.max(canvasMain.width / CONSTANTS.VISIBLE_WIDTH, canvasMain.height / CONSTANTS.VISIBLE_HEIGHT)
    ctxMain.translate(canvasMain.width / 2, canvasMain.height / 2)
    ctxMain.scale(size, size)
    ctxMain.translate(-gamestate.me.centroid.x, -gamestate.me.centroid.y)

    renderMap()
    //ctxMain.globalAlpha = 0.5
    renderMaze(gamestate.maze, gamestate.time)
    //ctxMain.globalAlpha = 1
    for (let i in gamestate.powerups) {
        renderPowerup(gamestate.powerups[i])
    }
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
    drawInset(CONSTANTS.MAZE_OVERLAP, CONSTANTS.MAP_SHADOW_COLOUR)

    
    let existingMaze = maze.filter(function(val : Obstacle) {
        return val.existsAt(time)
    })
    let newMaze = maze.filter(function(val : Obstacle) {
        return val.existsAfter(time)
    })

    ctxMain.globalAlpha = 0.7
    ctxMain.globalCompositeOperation = "darken"
    ctxMain.fillStyle = CONSTANTS.MAP_WARNING_COLOUR
    for (let i in newMaze) {
        ctxMain.beginPath()
        for (let j in newMaze[i].points) {
            ctxMain.lineTo(newMaze[i].points[j].x, newMaze[i].points[j].y)
        }
        ctxMain.lineTo(newMaze[i].points[0].x, newMaze[i].points[0].y)
        ctxMain.lineTo(newMaze[i].points[1].x, newMaze[i].points[1].y)
        ctxMain.fill()
        //ctxMain.stroke()
    }
    ctxMain.globalAlpha = 1
    ctxMain.globalCompositeOperation = "source-over"

    ctxMain.strokeStyle = CONSTANTS.MAP_SHADOW_COLOUR
    ctxMain.lineWidth = 2 * CONSTANTS.MAP_SHADOW_WIDTH
    for (let i in existingMaze) {
        ctxMain.beginPath()
        for (let j in existingMaze[i].points) {
            ctxMain.lineTo(existingMaze[i].points[j].x, existingMaze[i].points[j].y)
        }
        ctxMain.lineTo(existingMaze[i].points[0].x, existingMaze[i].points[0].y)
        ctxMain.lineTo(existingMaze[i].points[1].x, existingMaze[i].points[1].y)
        ctxMain.stroke()
    }

    ctxMain.fillStyle = CONSTANTS.MAP_UNREACHABLE_COLOUR
    for (let i in existingMaze) {
        ctxMain.beginPath()
        for (let j in existingMaze[i].points) {
            ctxMain.lineTo(existingMaze[i].points[j].x, existingMaze[i].points[j].y)
        }
        // TODO: handle 0 width gaps
        ctxMain.lineTo(existingMaze[i].points[0].x, existingMaze[i].points[0].y)
        ctxMain.lineTo(existingMaze[i].points[1].x, existingMaze[i].points[1].y)
        ctxMain.fill()
    }
    

    drawInset(CONSTANTS.MAZE_OVERLAP / 2, CONSTANTS.MAP_UNREACHABLE_COLOUR)
}

function renderPowerup(powerup: Powerup) {
    ctxMain.fillStyle = CONSTANTS.POWERUP_COLOUR
    ctxMain.beginPath()
    ctxMain.arc(powerup.centroid.x, powerup.centroid.y, CONSTANTS.POWERUP_RADIUS, 0, 2 * Math.PI)
    ctxMain.fill()
}

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

    /*ctxMain.beginPath()
    let innerRadius: number = CONSTANTS.PLAYER_RADIUS - CONSTANTS.PLAYER_LINE_WIDTH
    ctxMain.rect(-innerRadius, -innerRadius, 2 * innerRadius, 2 * innerRadius)
    ctxMain.fill()
    ctxMain.stroke()*/
    //ctxMain.drawImage(ducc, -138, -96)
    ctxMain.fillRect(0, -2, 50, 2)

    ctxMain.rotate(-player.direction)
    ctxMain.fillStyle = CONSTANTS.PLAYER_DEFAULT_COLOUR
    ctxMain.font = CONSTANTS.CANVAS_FONT
    ctxMain.textAlign = "center"
    ctxMain.fillText(player.name, 0, CONSTANTS.PLAYER_NAME_OFFSET)

    ctxMain.restore()
}
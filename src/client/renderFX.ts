import * as CONSTANTS from "../shared/constants"
import { Position, add, sub } from "../shared/model/position"
import { ClientGameState } from "../shared/model/client_gamestate"
import { Obstacle } from "../shared/model/obstacle"

let buffer1: number[][] = Array(CONSTANTS.RIPPLE_WIDTH).fill([]).map(_ => Array(CONSTANTS.RIPPLE_HEIGHT).fill(0))
let buffer2: number[][] = Array(CONSTANTS.RIPPLE_WIDTH).fill([]).map(_ => Array(CONSTANTS.RIPPLE_HEIGHT).fill(0))
let temp: number[][] = []

const canvasFX = <HTMLCanvasElement> document.getElementById("canvas-fx")
const ctxFX: CanvasRenderingContext2D = canvasFX.getContext("2d")


export function renderFX(gamestate: ClientGameState, shift: Position) {
    if (shift.x != 0 || shift.y != 0) {
        buffer1 = shiftBuffer(buffer1, shift)
        buffer2 = shiftBuffer(buffer2, shift)
    }
    
    for (let i in gamestate.others) {
        makeDisturbance(sub(gamestate.others[i].centroid, gamestate.me.centroid), CONSTANTS.RIPPLE_PLAYER_SIZE)
    }
    makeDisturbance(new Position(0, 0), CONSTANTS.RIPPLE_PLAYER_SIZE)

    for (let i in gamestate.maze) {
        if (gamestate.maze[i].time < gamestate.time) {
            addObstacle(gamestate.maze[i])
        }
    }
    rippleAnimation()
}

function inGrid(x: number, y: number) {
    return 1 <= x && x < CONSTANTS.RIPPLE_WIDTH - 1 && 1 <= y && y < CONSTANTS.RIPPLE_HEIGHT - 1
}

function addObstacle(obstacle: Obstacle) {
    // TODO: set values in buffer2 to 0 when inside obstacle
}

function shiftBuffer(buffer: number[][], shift: Position) {
    let bufferOut = Array(CONSTANTS.RIPPLE_WIDTH).fill([]).map(_ => Array(CONSTANTS.RIPPLE_HEIGHT).fill(0))
    /*for (let x = 1; x < CONSTANTS.RIPPLE_WIDTH - 1; ++x) {
        for (let y = 1; y < CONSTANTS.RIPPLE_HEIGHT - 1; ++y) {
            if (inGrid(x + shift.x, y + shift.y)) {
                bufferOut[x][y] = buffer[x + shift.x][y + shift.y]
            }
        }
    }*/
    let xL = 1 + Math.max(0, -shift.x)
    let xR = CONSTANTS.RIPPLE_WIDTH + Math.min(0, -shift.x)
    let yL = 1 + Math.max(0, -shift.y)
    let yR = CONSTANTS.RIPPLE_WIDTH + Math.min(0, -shift.y)

    for (let x = xL; x < xR; ++x) {
        for (let y = yL; y < yR; ++y) {
            bufferOut[x][y] = buffer[x + shift.x][y + shift.y]
        }
    }
    return bufferOut
}

function makeDisturbance(pos: Position, percentSize: number) {

    // pen stroke size
    let size = percentSize * Math.min(window.innerWidth, window.innerHeight)

    let scaleW = CONSTANTS.RIPPLE_WIDTH / window.innerWidth
    let scaleH = CONSTANTS.RIPPLE_HEIGHT / window.innerHeight
    let center = new Position(CONSTANTS.RIPPLE_WIDTH / 2, CONSTANTS.RIPPLE_HEIGHT / 2)
    pos = add(center, new Position(pos.x * scaleW, pos.y * scaleH)).round()

    let sizeW = Math.round(size * scaleW)
    let sizeH = Math.round(size * scaleH)

    for (let dx = -sizeW; dx <= sizeW; ++dx) {
        for (let dy = -sizeH; dy <= sizeH; ++dy) {
            if (new Position(dx / scaleW, dy / scaleH).quadrance() <= size * size) {
                //let newPos = add(pos, new Position(dx, dy))
                if (inGrid(pos.x + dx, pos.y + dx) /*&& !isObstacle(newPos)*/) {
                    buffer1[pos.x + dx][pos.y + dy] = CONSTANTS.RIPPLE_PEN_COLOUR
                }
            }
        }
    }
}

function rippleAnimation() {
    let img = new ImageData(CONSTANTS.RIPPLE_WIDTH, CONSTANTS.RIPPLE_HEIGHT)
    for (let x = 0; x < CONSTANTS.RIPPLE_WIDTH ; ++x) {
        for (let y = 0; y < CONSTANTS.RIPPLE_HEIGHT; ++y) {
            //if (isObstacle(new Position(x, y))) continue;
            if (inGrid(x, y)) {
                buffer2[x][y] = ((buffer1[x - 1][y] + buffer1[x + 1][y] + buffer1[x][y - 1] + buffer1[x][y + 1]) >> 1) - buffer2[x][y]
                buffer2[x][y] -= buffer2[x][y] >> CONSTANTS.RIPPLE_DAMPENING
            }
            let index = (y * CONSTANTS.RIPPLE_WIDTH + x) * 4
            img.data[index + 0] = buffer2[x][y]
            img.data[index + 1] = buffer2[x][y]
            img.data[index + 2] = 255
            img.data[index + 3] = 255
        }
    }
    ctxFX.putImageData(img, 0, 0)

    temp = buffer2
    buffer2 = buffer1
    buffer1 = temp
}

/*let t = 0
function loading() {
    let scaleW = CONSTANTS.RIPPLE_WIDTH / window.innerWidth
    let scaleH = CONSTANTS.RIPPLE_HEIGHT / window.innerHeight
    let r = 150 / Math.max(scaleW, scaleH)
    let omega = 0.08
    let center = new Position(window.innerWidth / 2, window.innerHeight / 2)
    makeDisturbance(
        add(new Position(Math.sin(t * omega), Math.cos(t * omega)).scale(r), center),
        0.015
    )
    t++
}

document.addEventListener("mousemove", function (e) {
    makeDisturbance(new Position(e.clientX, e.clientY), 0.015)
})

document.addEventListener("click", function (e) {
    makeDisturbance(new Position(e.clientX, e.clientY), 0.005)
})*/
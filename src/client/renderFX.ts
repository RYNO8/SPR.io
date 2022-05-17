import * as CONSTANTS from "../shared/constants"
import { Position, add, sub } from "../shared/model/position"
import { ClientGameState } from "../shared/model/client_gamestate"
import { Obstacle } from "../shared/model/obstacle"

let center = new Position(CONSTANTS.RIPPLE_WIDTH / 2, CONSTANTS.RIPPLE_HEIGHT / 2)
const canvasFX = <HTMLCanvasElement> document.getElementById("canvas-fx")
const ctxFX: CanvasRenderingContext2D = canvasFX.getContext("2d")

let buffer1: number[][] = Array(CONSTANTS.RIPPLE_WIDTH).fill([]).map(_ => Array(CONSTANTS.RIPPLE_HEIGHT).fill(0))
let buffer2: number[][] = Array(CONSTANTS.RIPPLE_WIDTH).fill([]).map(_ => Array(CONSTANTS.RIPPLE_HEIGHT).fill(0))
let lookPos = new Position(0, 0)


function toRipplePos(pos: Position) {
    let scaleW = CONSTANTS.RIPPLE_WIDTH / window.innerWidth
    let scaleH = CONSTANTS.RIPPLE_HEIGHT / window.innerHeight
    return new Position(pos.x * scaleW, pos.y * scaleH)
}

export function renderFX(gamestate: ClientGameState) {
    let oldLookPos = lookPos
    let rippleMe = toRipplePos(gamestate.me.centroid)
    lookPos = rippleMe.scale(1 / CONSTANTS.RIPPLE_REDRAW_DIST).round().scale(CONSTANTS.RIPPLE_REDRAW_DIST)
    let shift = sub(lookPos, oldLookPos)
    let lookPosTweeked = add(lookPos, sub(rippleMe, rippleMe.round()))
    
    if (shift.x != 0 || shift.y != 0) {
        buffer1 = shiftBuffer(buffer1, shift)
        buffer2 = shiftBuffer(buffer2, shift)
    }

    for (let i in gamestate.others) {
        makeDisturbance(
            sub(toRipplePos(gamestate.others[i].centroid), lookPosTweeked),
            CONSTANTS.RIPPLE_PLAYER_SIZE
        )
    }
    makeDisturbance(
        sub(rippleMe, lookPosTweeked),
        CONSTANTS.RIPPLE_PLAYER_SIZE
    )

    for (let i in gamestate.maze) {
        if (gamestate.maze[i].time < gamestate.time) {
            addObstacle(gamestate.maze[i])
        }
    }
    rippleStep()
    rippleRender(sub(rippleMe, lookPos))
}

function inGrid(x: number, y: number) {
    return 1 <= x && x < CONSTANTS.RIPPLE_WIDTH - 1 && 1 <= y && y < CONSTANTS.RIPPLE_HEIGHT - 1
}

function addObstacle(obstacle: Obstacle) {
    // TODO: set values in buffer2 to 0 when inside obstacle
    for (let i = 0; i < obstacle.points.length; ++i) {

    }
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
    let xR = CONSTANTS.RIPPLE_WIDTH - 1 + Math.min(0, -shift.x)
    let yL = 1 + Math.max(0, -shift.y)
    let yR = CONSTANTS.RIPPLE_HEIGHT - 1 + Math.min(0, -shift.y)

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
    pos = add(center, pos)

    let sizeW = Math.round(size * scaleW)
    let sizeH = Math.round(size * scaleH)

    for (let dx = Math.floor(pos.x - sizeW); dx <= Math.ceil(pos.x + sizeW); ++dx) {
        for (let dy = Math.floor(pos.y - sizeH); dy <= Math.ceil(pos.y + sizeH); ++dy) {
            if (inGrid(dx, dy)) {
                /*if (new Position((dx - pos.x) / scaleW, (dy - pos.y) / scaleH).quadrance() <= size * size) {
                    buffer1[dx][dy] = CONSTANTS.RIPPLE_PEN_COLOUR
                }*/
                let shade = size * size / (new Position((dx - pos.x) / scaleW, (dy - pos.y) / scaleH).quadrance())
                if (shade >= 1) {
                    buffer1[dx][dy] = Math.floor(CONSTANTS.RIPPLE_PEN_COLOUR * Math.min(1, shade))
                }
            }
        }
    }
}

function rippleStep() {
    for (let x = 1; x < CONSTANTS.RIPPLE_WIDTH - 1; ++x) {
        for (let y = 1; y < CONSTANTS.RIPPLE_HEIGHT - 1; ++y) {
            //if (isObstacle(new Position(x, y))) continue;
            buffer2[x][y] = (buffer1[x - 1][y] + buffer1[x + 1][y] + buffer1[x][y - 1] + buffer1[x][y + 1]) / 2 - buffer2[x][y]
            buffer2[x][y] = Math.floor(buffer2[x][y] * CONSTANTS.RIPPLE_DAMPENING)
            //buffer2[x][y] = Math.max(0, Math.min(255, buffer2[x][y]))
        }
    }

    let temp = buffer2
    buffer2 = buffer1
    buffer1 = temp
}

function rippleRender(pos: Position) {
    let img = new ImageData(CONSTANTS.RIPPLE_WIDTH, CONSTANTS.RIPPLE_HEIGHT)
    for (let x = 0; x < CONSTANTS.RIPPLE_WIDTH; ++x) {
        for (let y = 0; y < CONSTANTS.RIPPLE_HEIGHT; ++y) {
            let index = (y * CONSTANTS.RIPPLE_WIDTH + x) * 4
            let val = Math.max(0, Math.min(255, buffer2[x][y]))
            img.data[index + 0] = val
            img.data[index + 1] = val
            img.data[index + 2] = 255
            img.data[index + 3] = 255
        }
    }

    ctxFX.fillStyle = "blue"
    ctxFX.fillRect(0, 0, CONSTANTS.RIPPLE_WIDTH, CONSTANTS.RIPPLE_HEIGHT)
    //ctxFX.clearRect(0, 0, CONSTANTS.RIPPLE_WIDTH, CONSTANTS.RIPPLE_HEIGHT)
    ctxFX.putImageData(img, Math.round(-pos.x), Math.round(-pos.y))
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
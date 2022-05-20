import * as CONSTANTS from "../shared/constants"
import { Position, add, sub, DIRECTIONS_8 } from "../shared/model/position"
import { ClientGameState } from "../shared/model/client_gamestate"
import { Obstacle } from "../shared/model/obstacle"

let center = new Position(CONSTANTS.RIPPLE_TRUE_WIDTH / 2 + CONSTANTS.RIPPLE_BORDER_SIZE, CONSTANTS.RIPPLE_TRUE_HEIGHT / 2 + CONSTANTS.RIPPLE_BORDER_SIZE)
const canvasFX = <HTMLCanvasElement> document.getElementById("canvas-fx")
const ctxFX: CanvasRenderingContext2D = canvasFX.getContext("2d")

function genBuffer(fillVal: any) {
    return Array(CONSTANTS.RIPPLE_WIDTH).fill([]).map(_ => Array(CONSTANTS.RIPPLE_HEIGHT).fill(fillVal))
}

let buffer1: number[][] = genBuffer(0)
let buffer2: number[][] = genBuffer(0)
let lookPos = new Position(0, 0)
let canPlace: boolean[][]

function toRipplePos(pos: Position) {
    let scaleW = CONSTANTS.RIPPLE_TRUE_WIDTH / window.innerWidth
    let scaleH = CONSTANTS.RIPPLE_TRUE_HEIGHT / window.innerHeight
    let size = Math.max(window.innerWidth / CONSTANTS.VISIBLE_WIDTH, window.innerHeight / CONSTANTS.VISIBLE_HEIGHT)
    //return new Position(pos.x * scaleW * size * CONSTANTS.RIPPLE_SPEED, pos.y * scaleH * size * CONSTANTS.RIPPLE_SPEED)
    return new Position(pos.x * scaleW * size, pos.y * scaleH * size)
}

export function renderFX(gamestate: ClientGameState) {
    canPlace = genBuffer(true)
    /*for (let i in gamestate.maze) {
        if (gamestate.maze[i].existsAt(gamestate.time)) {
            addObstacle(gamestate.maze[i])
        }
    }*/

    let oldLookPos = lookPos
    let rippleMe = toRipplePos(gamestate.me.centroid)
    let cameraPos = add(rippleMe.mod(CONSTANTS.RIPPLE_REDRAW_DIST), center)
    lookPos = sub(rippleMe, cameraPos)
    
    let shift = sub(lookPos, oldLookPos).floor()
    if (shift.x !== 0 || shift.y !== 0) {
        buffer1 = shiftBuffer(buffer1, shift)
        buffer2 = shiftBuffer(buffer2, shift)
    }

    for (let i in gamestate.others) {
        let rippleOther = toRipplePos(gamestate.others[i].centroid)
        makeDisturbance(
            rippleOther,
            CONSTANTS.RIPPLE_PLAYER_SIZE
        )
    }

    if (gamestate.me.isVisible) {
        makeDisturbance(
            rippleMe,
            CONSTANTS.RIPPLE_PLAYER_SIZE
        )
    }

    rippleRender(cameraPos)
}

function inGrid(x: number, y: number) {
    return 1 <= x && x < CONSTANTS.RIPPLE_WIDTH - 1 && 1 <= y && y < CONSTANTS.RIPPLE_HEIGHT - 1
}

function addObstacle(obstacle: Obstacle) {
    for (let i = 0; i < obstacle.interiorPoints.length; ++i) {
        let u = obstacle.interiorPoints[i]
        let v = obstacle.interiorPoints[(i + 1) % obstacle.interiorPoints.length]
        u = sub(toRipplePos(u), lookPos)
        v = sub(toRipplePos(v), lookPos)

        let stepSize = 1 / sub(v, u).euclideanDist()
        for (let lambda = 0; lambda <= 1; lambda += stepSize) {
            let pos = add(u.scale(lambda), v.scale(1 - lambda)).floor()
            if (inGrid(pos.x, pos.y)) {
                canPlace[pos.x][pos.y] = false
            }
        }
    }
}


function shiftBuffer(buffer: number[][], shift: Position) {
    let bufferOut = genBuffer(0)
    
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

    let scaleW = CONSTANTS.RIPPLE_TRUE_WIDTH / window.innerWidth
    let scaleH = CONSTANTS.RIPPLE_TRUE_HEIGHT / window.innerHeight
    pos = sub(pos, lookPos)

    let sizeW = 1.1 * Math.round(size * scaleW)
    let sizeH = 1.1 * Math.round(size * scaleH)

    for (let dx = Math.floor(pos.x - sizeW); dx <= Math.ceil(pos.x + sizeW); ++dx) {
        for (let dy = Math.floor(pos.y - sizeH); dy <= Math.ceil(pos.y + sizeH); ++dy) {
            if (inGrid(dx, dy) && canPlace[dx][dy]) {
                /*if (new Position((dx - pos.x) / scaleW, (dy - pos.y) / scaleH).quadrance() <= size * size) {
                    buffer1[dx][dy] = CONSTANTS.RIPPLE_PEN_COLOUR
                }*/
                let shade = size * size / (new Position((dx - pos.x) / scaleW, (dy - pos.y) / scaleH).quadrance())
                if (shade >= CONSTANTS.RIPPLE_GRADIENT_SIZE) {
                    buffer1[dx][dy] = Math.floor(CONSTANTS.RIPPLE_PEN_COLOUR * Math.min(1, shade))
                }
            }
        }
    }
}

// https://dev.to/victorqribeiro/water-ripple-effect-using-canvas-2l19
// https://jasonjhayes.azurewebsites.net/WebDev/WaterRipple/
function rippleRender(pos: Position) {
    let img = new ImageData(CONSTANTS.RIPPLE_WIDTH, CONSTANTS.RIPPLE_HEIGHT)

    for (let x = 0; x < CONSTANTS.RIPPLE_WIDTH; ++x) {
        for (let y = 0; y < CONSTANTS.RIPPLE_HEIGHT; ++y) {
            let index = (x + y * (CONSTANTS.RIPPLE_WIDTH)) * 4
            if (!inGrid(x, y)) {
                // TODO: make this water colour
                img.data[index + 0] = 0
                img.data[index + 1] = 0
                img.data[index + 2] = 255
                img.data[index + 3] = 255
            } else if (!canPlace[x][y]) {
                // TODO: make this border or water colour
                img.data[index + 0] = 0
                img.data[index + 1] = 0
                img.data[index + 2] = 255
                img.data[index + 3] = 255
            } else {
                

                buffer2[x][y] = ((buffer1[x - 1][y] + buffer1[x + 1][y] + buffer1[x][y - 1] + buffer1[x][y + 1]) >> 1) - buffer2[x][y]
                buffer2[x][y] = Math.floor(buffer2[x][y] * CONSTANTS.RIPPLE_DAMPENING)
                //buffer2[x][y] = Math.max(0, Math.min(255, buffer2[x][y]))

                let val = buffer2[x][y] //Math.max(0, Math.min(255, buffer2[x][y]))
                img.data[index + 0] = val
                img.data[index + 1] = val
                img.data[index + 2] = 255
                img.data[index + 3] = 255
            }
        }
    }

    let temp = buffer2
    buffer2 = buffer1
    buffer1 = temp

    ctxFX.fillStyle = "blue"
    ctxFX.fillRect(0, 0, CONSTANTS.RIPPLE_TRUE_WIDTH, CONSTANTS.RIPPLE_TRUE_HEIGHT)
    ctxFX.putImageData(img, -pos.x + CONSTANTS.RIPPLE_TRUE_WIDTH / 2, -pos.y + CONSTANTS.RIPPLE_TRUE_HEIGHT / 2)
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
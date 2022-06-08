import * as CONSTANTS from "../shared/constants"
import { Position, add, sub } from "../shared/model/position"
import { ClientGameState } from "./client_gamestate"
import { Obstacle } from "../shared/model/obstacle"
import { Powerup } from "../shared/model/powerup"
import { clamp, HSVtoRGB, randChance, randRange } from "../shared/utilities"

let center = new Position(CONSTANTS.RIPPLE_TRUE_WIDTH / 2 + CONSTANTS.RIPPLE_BORDER_SIZE, CONSTANTS.RIPPLE_TRUE_HEIGHT / 2 + CONSTANTS.RIPPLE_BORDER_SIZE)
const canvasFX = <HTMLCanvasElement> document.getElementById("canvas-fx")
const ctxFX: CanvasRenderingContext2D = canvasFX.getContext("2d", { alpha: true })

let buffer1 = new Uint8ClampedArray(CONSTANTS.RIPPLE_WIDTH * CONSTANTS.RIPPLE_HEIGHT).fill(0)
let buffer2 = new Uint8ClampedArray(CONSTANTS.RIPPLE_WIDTH * CONSTANTS.RIPPLE_HEIGHT).fill(0)
let lookPos = new Position(0, 0)
let canPlace = new Set<[number, number]>()
let cachedColours: {r: number, b: number, g: number}[] = []

for (let i = 0; i <= 255; ++i) {
    let val = clamp(i / 255) * 0.8
    cachedColours.push(HSVtoRGB({
        h: CONSTANTS.MAP_WATER_COLOUR.h,
        s: CONSTANTS.MAP_WATER_COLOUR.s * (1 - val),
        v: CONSTANTS.MAP_WATER_COLOUR.v * (1 - val) + val
    }))
}

function toRipplePos(pos: Position) {
    let scaleW = CONSTANTS.RIPPLE_TRUE_WIDTH / window.innerWidth
    let scaleH = CONSTANTS.RIPPLE_TRUE_HEIGHT / window.innerHeight
    let size = Math.max(window.innerWidth / CONSTANTS.VISIBLE_WIDTH, window.innerHeight / CONSTANTS.VISIBLE_HEIGHT)
    //return new Position(pos.x * scaleW * size * CONSTANTS.RIPPLE_SPEED, pos.y * scaleH * size * CONSTANTS.RIPPLE_SPEED)
    return new Position(pos.x * scaleW * size, pos.y * scaleH * size)
}

export function renderFX(gamestate: ClientGameState, dt: number) {
    canPlace.clear()
    // prevents ripples from travelling through obstacles and out the other side
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

    if (randChance(dt * CONSTANTS.RIPPLE_BUBBLE_RATE)) {
        makeDisturbance(
            add(new Position(randRange(0, CONSTANTS.RIPPLE_WIDTH), randRange(0, CONSTANTS.RIPPLE_HEIGHT)), lookPos),
            CONSTANTS.RIPPLE_BUBBLE_SIZE
        )
    }

    /*for (let i in gamestate.powerups) {
        renderPowerup(gamestate.powerups[i])
    }*/
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
                canPlace.add([pos.x, pos.y])
            }
        }
    }
}


function shiftBuffer(buffer: Uint8ClampedArray, shift: Position) {
    let bufferOut = new Uint8ClampedArray(CONSTANTS.RIPPLE_WIDTH * CONSTANTS.RIPPLE_HEIGHT).fill(0)
    
    let xL = 1 + Math.max(0, -shift.x)
    let xR = CONSTANTS.RIPPLE_WIDTH - 1 + Math.min(0, -shift.x)
    let yL = 1 + Math.max(0, -shift.y)
    let yR = CONSTANTS.RIPPLE_HEIGHT - 1 + Math.min(0, -shift.y)

    for (let x = xL; x < xR; ++x) {
        for (let y = yL; y < yR; ++y) {
            bufferOut[x + y * CONSTANTS.RIPPLE_WIDTH] = buffer[(x + shift.x) + (y + shift.y) * CONSTANTS.RIPPLE_WIDTH]
        }
    }
    return bufferOut
}

function renderPowerup(powerup: Powerup) {
    let pos = toRipplePos(powerup.centroid)
    let posHash = pos.x * pos.y // some value dependant on the powerup location, so that powerups dont all rotate in sync
    let rotation = new Position(0, CONSTANTS.POWERUP_RADIUS / 2).rotate(Date.now() * CONSTANTS.POWERUP_OMEGA + posHash)
    makeDisturbance(add(pos, rotation), CONSTANTS.RIPPLE_BUBBLE_SIZE)
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
            if (inGrid(dx, dy) && !canPlace.has([dx, dy])) {
                /*if (new Position((dx - pos.x) / scaleW, (dy - pos.y) / scaleH).quadrance() <= size * size) {
                    buffer1[dx][dy] = CONSTANTS.RIPPLE_PEN_COLOUR
                }*/
                let shade = size * size / (new Position((dx - pos.x) / scaleW, (dy - pos.y) / scaleH).quadrance())
                if (shade >= CONSTANTS.RIPPLE_GRADIENT_SIZE) {
                    buffer1[dx + dy * CONSTANTS.RIPPLE_WIDTH] = Math.floor(CONSTANTS.RIPPLE_PEN_COLOUR * Math.min(1, shade))
                }
            }
        }
    }
}

// https://dev.to/victorqribeiro/water-ripple-effect-using-canvas-2l19
// https://jasonjhayes.azurewebsites.net/WebDev/WaterRipple/
function rippleRender(pos: Position) {
    let img = new ImageData(CONSTANTS.RIPPLE_WIDTH, CONSTANTS.RIPPLE_HEIGHT)

    // for x = [1 .. RIPPLE_WIDTH - 1)
    // for y = [1 .. RIPPLE_HEIGHT - 1)
    for (let y = 0; ++y < CONSTANTS.RIPPLE_HEIGHT - 1;) {
        for (let x = 0; ++x < CONSTANTS.RIPPLE_WIDTH - 1;) {
            let index = x + y * CONSTANTS.RIPPLE_WIDTH
            if (true || !canPlace.has([x, y])) {
                // NOTE: buffer2[index] is always a clamped integer
                let sum = buffer1[index - 1];
                sum += buffer1[index + 1];
                sum += buffer1[index - CONSTANTS.RIPPLE_WIDTH];
                sum += buffer1[index + CONSTANTS.RIPPLE_WIDTH];
                buffer2[index] = ((sum >> 1) - buffer2[index]) * CONSTANTS.RIPPLE_DAMPENING
                
                let val = buffer2[index]
                index *= 4
                if (val) {
                    img.data[index + 0] = cachedColours[val].r
                    img.data[index + 1] = cachedColours[val].g
                    img.data[index + 2] = cachedColours[val].b
                    img.data[index + 3] = 255
                }
            }
        }
    }

    let temp = buffer2
    buffer2 = buffer1
    buffer1 = temp

    ctxFX.putImageData(img, -pos.x + CONSTANTS.RIPPLE_TRUE_WIDTH / 2, -pos.y + CONSTANTS.RIPPLE_TRUE_HEIGHT / 2)
}

/*document.addEventListener("mousemove", function (e) {
    makeDisturbance(new Position(e.clientX, e.clientY), 0.015)
})

document.addEventListener("click", function (e) {
    makeDisturbance(new Position(e.clientX, e.clientY), 0.005)
})*/
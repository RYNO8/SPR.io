import { socket } from "./networking"
import { ClientGameState } from "../shared/model/gamestate"
import * as CONSTANTS from "../shared/constants"
import { Player } from "../shared/model/player"
import { direction } from "./send"
import { Powerup } from "../shared/model/powerup"
import { PriorityQueue } from "@datastructures-js/priority-queue";


let targetStates = new PriorityQueue<ClientGameState>(function(a: ClientGameState, b: ClientGameState) { return b.time - a.time })
let gamestate = new ClientGameState(0, [], [])
let initTimeDiff: boolean = true
let timeDiff: number = 0
let framerateSamples: number[] = []

const canvas = <HTMLCanvasElement> document.getElementById('game-canvas')
const context: CanvasRenderingContext2D = canvas.getContext('2d')
context.font = CONSTANTS.CANVAS_FONT

function serverTime() {
    return Date.now() + timeDiff /*- CONSTANTS.RENDER_DELAY*/
}

socket.on(CONSTANTS.ENDPOINT_UPDATE_GAME_STATE, function(jsonstate: any) {
    let gamestate: ClientGameState = new ClientGameState(jsonstate.time, jsonstate.players, jsonstate.powerups)
    if (initTimeDiff) {
        timeDiff = gamestate.time - Date.now()
        initTimeDiff = false
    }
    targetStates.enqueue(gamestate)
})

function updateFramerate() {
    framerateSamples.push(Date.now())
    while (framerateSamples.length > CONSTANTS.CLIENT_FRAME_RATE_SAMPLE_SIZE) {
        framerateSamples.shift() // pop
    }
}

// modify gamestate towards targetState
function updateGamestate() {
    while (targetStates.size() > 0 && targetStates.front().time < serverTime()) {
        targetStates.dequeue()
    }
    if (targetStates.size() == 0) {
        return
    }

    let targetState: ClientGameState = targetStates.front()
    let framerate = (framerateSamples.length - 1) / (framerateSamples[framerateSamples.length - 1] - framerateSamples[0])
    for (let i in targetState.players) {
        let prev = gamestate.players.find(function(value: Player) { return value.id == targetState.players[i].id })
        if (prev) {
            prev.updatePlayer(targetState.players[i], framerate)
            targetState.players[i] = prev
        }
    }
    gamestate = targetState
}

export function render() {
    updateFramerate()
    updateGamestate()
    context.restore()
    context.save()
    renderBackground()
    updateLeaderboard(gamestate)

    let me: Player = gamestate.players[gamestate.players.length - 1]
    if (me && me.id == socket.id) {
        document.getElementById("menu").style.visibility = "hidden"
    } else {
        document.getElementById("menu").style.visibility = "visible"
    }
    if (gamestate.players.length == 0) {
        

        let size: number = Math.min(canvas.width, canvas.height)
        context.translate((canvas.width - size) / 2, (canvas.height - size) / 2)
        context.scale(size / CONSTANTS.MAP_SIZE, size / CONSTANTS.MAP_SIZE)
    } else {
        let size: number = Math.min(canvas.width, canvas.height) / CONSTANTS.VISIBLE_REGION
        context.translate(canvas.width / 2, canvas.height / 2)
        context.scale(size / CONSTANTS.MAP_SIZE, size / CONSTANTS.MAP_SIZE)
        context.translate(-me.x, -me.y)
    }

    renderMap()
    for (let i in gamestate.powerups) {
        renderPowerup(gamestate.powerups[i])
    }
    for (let i in gamestate.players) {
        if (gamestate.players[i].id == socket.id) {
            gamestate.players[i].direction = direction
        }
        renderPlayer(gamestate.players[i], gamestate.players[i].getColour(me))
    }

    // Rerun this render function on the next frame
    requestAnimationFrame(render)
}

function renderBackground() {
    // clear all from previous render
    context.clearRect(0, 0, canvas.width, canvas.height)

    // unreachable
    context.fillStyle = CONSTANTS.MAP_UNREACHABLE_COLOUR
    context.fillRect(0, 0, canvas.width, canvas.height)
}

function renderPowerup(powerup: Powerup) {
    context.fillStyle = CONSTANTS.POWERUP_COLOUR
    context.beginPath()
    context.arc(powerup.x, powerup.y, CONSTANTS.POWERUP_RADIUS, 0, 2 * Math.PI)
    context.fill()
}

function renderMap() {
    // boundaries
    context.fillStyle = CONSTANTS.MAP_BACKGROUND_COLOUR
    context.strokeStyle = CONSTANTS.MAP_LINE_COLOUR
    context.lineWidth = CONSTANTS.MAP_LINE_WIDTH
    context.beginPath()
    context.rect(0, 0, CONSTANTS.MAP_SIZE, CONSTANTS.MAP_SIZE)
    context.fill()
    context.stroke()

    if (CONSTANTS.MAP_STYLE == "grid") {
        for (let x = 0; x <= CONSTANTS.MAP_SIZE; x += CONSTANTS.MAP_GRID) {
            context.strokeStyle = CONSTANTS.MAP_LINE_COLOUR
            context.lineWidth = CONSTANTS.MAP_LINE_WIDTH
            context.beginPath()
            context.moveTo(x, 0)
            context.lineTo(x, CONSTANTS.MAP_SIZE)
            context.stroke()
        }
        for (let y = 0; y <= CONSTANTS.MAP_SIZE; y += CONSTANTS.MAP_GRID) {
            context.strokeStyle = CONSTANTS.MAP_LINE_COLOUR
            context.lineWidth = CONSTANTS.MAP_LINE_WIDTH
            context.beginPath()
            context.moveTo(0, y)
            context.lineTo(CONSTANTS.MAP_SIZE, y)
            context.stroke()
        }
    } else if (CONSTANTS.MAP_STYLE == "dots") {
        for (let x = CONSTANTS.MAP_GRID; x < CONSTANTS.MAP_SIZE; x += CONSTANTS.MAP_GRID) {
            for (let y = CONSTANTS.MAP_GRID; y < CONSTANTS.MAP_SIZE; y += CONSTANTS.MAP_GRID) {
                context.fillStyle = CONSTANTS.MAP_LINE_COLOUR
                context.fillRect(x - 2, y - 2, 4, 4)
            }
        }
    }
}


// Renders a ship at the given coordinates
function renderPlayer(player: Player, colour: string) {
    context.save()

    context.translate(player.x, player.y)
    context.rotate(player.direction)
    if (player.hasPowerup >= serverTime()) {
            context.fillStyle = CONSTANTS.PLAYER_POWERUP_COLOUR
    } else {
            context.fillStyle = CONSTANTS.PLAYER_DEFAULT_COLOUR
    }
    context.strokeStyle = colour
    context.lineWidth = CONSTANTS.PLAYER_LINE_WIDTH

    // Draw ship
    context.beginPath()
    let innerRadius: number = CONSTANTS.PLAYER_RADIUS - CONSTANTS.PLAYER_LINE_WIDTH
    context.rect(-innerRadius, -innerRadius, 2 * innerRadius, 2 * innerRadius)
    context.fill()
    context.stroke()

    // Draw text
    context.rotate(-player.direction)
    context.fillStyle = CONSTANTS.PLAYER_DEFAULT_COLOUR
    context.font = CONSTANTS.CANVAS_FONT
    context.textAlign = "center"
    context.fillText(player.name, 0, CONSTANTS.PLAYER_NAME_OFFSET)

    context.restore()
}

function updateLeaderboard(gamestate: ClientGameState) {
    let sortedPlayers: Player[] = Object.values(gamestate.players).sort(function(p1: Player, p2: Player) {
        return p2.score - p1.score
    })

    let table = document.querySelector("#leaderboard > table > tbody")
    table.innerHTML = ""
    sortedPlayers.map(function(p: Player, i: number) {
        let rank = document.createElement("td")
        rank.innerHTML = "#" + (i + 1).toString()

        let name = document.createElement("td")
        name.innerHTML = p.name

        let score = document.createElement("td")
        score.innerHTML = p.score.toString()

        let row = document.createElement("tr")
        row.appendChild(rank)
        row.appendChild(name)
        row.appendChild(score)
        
        table.appendChild(row)
    })
}
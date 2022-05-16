import { socket } from "./networking"
import { ClientGameState } from "../shared/model/client_gamestate"
import * as CONSTANTS from "../shared/constants"
import { Player } from "../shared/model/player"
import { direction } from "./playerInput"
import { initGameoverMenu, initDisconnectedMenu } from "./events"
import { RollingAvg } from "../shared/utilities"
import { renderUnreachable, renderMain } from "./renderMain"
import { renderFX } from "./renderFX"
import { Position, sub } from "../shared/model/position"

let targetStates: ClientGameState[] = []
let gamestate = new ClientGameState(Date.now(), null, null, [], [], [])
let prevMe: Player = new Player(new Position(0, 0), null, null, false)
let isInGame: boolean = false
let framerateSamples = new RollingAvg(CONSTANTS.SAMPLE_SIZE, 1)
let timeDiff = new RollingAvg(CONSTANTS.SAMPLE_SIZE, 0)
let latencySamples = new RollingAvg(CONSTANTS.SAMPLE_SIZE, 0)

let ducc = new Image()
ducc.src = "/img/ducc.svg"

const debug1 = document.getElementById("debug-1")
const debug2 = document.getElementById("debug-2")
const debug3 = document.getElementById("debug-3")
const menu = document.getElementById("menu")
const gameoverMenu = document.getElementById("gameover-menu")

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

    renderUnreachable()
    
    if (isInGame && !socket.id) {
        // disconnected
        initDisconnectedMenu("Your bad internet connection", prevMe.score)
        isInGame = false
        prevMe.score = 0
        requestAnimationFrame(render)
        return
    } else if (isInGame && gamestate.attackerName) {
        // died
        initGameoverMenu(gamestate.attackerName, prevMe.score)
        isInGame = false
        prevMe.score = 0
        requestAnimationFrame(render)
        return
    } else if (!gamestate.me) {
        // stuff hasnt initialised yet, wait some more
        isInGame = false
        prevMe.score = 0
        requestAnimationFrame(render)
        return
    } else if (!gamestate.me.isVisible) {
        // nobody in the map OR looking at wall
        isInGame = false
        prevMe.score = 0
    } else if (gamestate.me.id == socket.id) {
        // nothing bad happened yet!
        menu.classList.remove("slide-in")
        menu.classList.add("slide-out")
        gameoverMenu.classList.remove("slide-in")
        gameoverMenu.classList.add("slide-out")

        console.assert(gamestate.me.score >= prevMe.score)
        isInGame = true
        gamestate.me.direction = direction

        renderFX(gamestate, sub(gamestate.me.centroid.scale(CONSTANTS.RIPPLE_SPEED).round(), prevMe.centroid.scale(CONSTANTS.RIPPLE_SPEED).round()))
        prevMe = gamestate.me
    }

    renderMain(gamestate)
    //console.log("main", Date.now() - start)

    // Rerun this render function on the next frame
    requestAnimationFrame(render)
}
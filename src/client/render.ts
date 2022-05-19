import { socket } from "./networking"
import { ClientGameState } from "../shared/model/client_gamestate"
import * as CONSTANTS from "../shared/constants"
import { direction } from "./playerInput"
import { initGameoverMenu, initDisconnectedMenu } from "./events"
import { RollingAvg } from "../shared/utilities"
import { renderUnreachable, renderMain } from "./renderMain"
import { renderFX } from "./renderFX"

let targetStates: ClientGameState[] = []
let gamestate = new ClientGameState(Date.now(), null, null, [], [], [])
let score = 0
let isInGame: boolean = false
let framerateSamples = new RollingAvg(CONSTANTS.SAMPLE_SIZE, 1)
let timeDiff = new RollingAvg(CONSTANTS.SAMPLE_SIZE, 0)
let latencySamplesMain = new RollingAvg(CONSTANTS.SAMPLE_SIZE, 0)
let latencySamplesFX = new RollingAvg(CONSTANTS.SAMPLE_SIZE, 0)

let ducc = new Image()
ducc.src = "/img/ducc.svg"

const debug1 = document.getElementById("debug-1")
const debug2 = document.getElementById("debug-2")
const debug3 = document.getElementById("debug-3")
const debug4 = document.getElementById("debug-4")
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
    latencySamplesMain.update(Date.now())
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
    debug1.innerText = latencySamplesMain.getDiff().toString()
    debug2.innerText = timeDiff.getAvg().toString()
    debug3.innerText = framerateSamples.getDiff().toString()
    debug4.innerText = latencySamplesFX.getDiff().toString()

    updateGamestate()

    renderUnreachable()
    
    if (isInGame && !socket.id) {
        // disconnected
        initDisconnectedMenu("Your bad internet connection", score)
        isInGame = false
        score = 0
        requestAnimationFrame(render)
        return
    } else if (isInGame && gamestate.attackerName) {
        // died
        initGameoverMenu(gamestate.attackerName, score)
        isInGame = false
        score = 0
        requestAnimationFrame(render)
        return
    } else if (!gamestate.me) {
        // stuff hasnt initialised yet, wait some more
        isInGame = false
        score = 0
        requestAnimationFrame(render)
        return
    } else if (!gamestate.me.isVisible) {
        // nobody in the map OR looking at wall
        isInGame = false
        score = 0
    } else if (gamestate.me.id == socket.id) {
        // nothing bad happened yet!
        menu.classList.remove("slide-in")
        menu.classList.add("slide-out")
        gameoverMenu.classList.remove("slide-in")
        gameoverMenu.classList.add("slide-out")

        //console.assert(gamestate.me.score >= score)
        isInGame = true
        gamestate.me.direction = direction
        score = gamestate.me.score
    }

    renderFX(gamestate)
    renderMain(gamestate)

    // Rerun this render function on the next frame
    requestAnimationFrame(render)
}
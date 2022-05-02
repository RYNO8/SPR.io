import { socket } from "./networking"
import * as CONSTANTS from "./../shared/constants"

const menu = document.getElementById("menu")
const gameoverMenu = document.getElementById("gameover-menu")
const canvas = <HTMLCanvasElement> document.getElementById("game-canvas")

export function initGameoverMenu(name: string, score: number) {
    gameoverMenu.classList.remove("slide-out")
    gameoverMenu.classList.add("slide-in")
    document.getElementById("gameover-title").innerText = "GAME OVER!"
    document.getElementById("eaten-by").innerText = name
    document.getElementById("score").innerText = score.toString()
}

export function initDisconnectedMenu(name: string, score: number) {
    gameoverMenu.classList.remove("slide-out")
    gameoverMenu.classList.add("slide-in")
    document.getElementById("gameover-title").innerText = "DISCONNECTED!"
    document.getElementById("eaten-by").innerText = name
    document.getElementById("score").innerText = score.toString()
}

// thank you Luke
export function onResize() {
    // get the ratio of physical pixels to CSS pixels
    const dpr = window.devicePixelRatio || 1

    // set the CSS dimensions of the canvas to fill the screen (using CSS pixels)
    canvas.style.width = `${window.innerWidth}px`
    canvas.style.height = `${window.innerHeight}px`

    // set the dimensions of the coordinate system used by the canvas - https://stackoverflow.com/a/2588404/5583289
    // (doesn't affect the actual size on screen I think)
    // because this is larger than the size on screen (when dpr > 1), it'll get scaled back down to normal
    // (while retaining the sharpness of all the physical pixels within each CSS pixel)
    canvas.width = window.innerWidth * dpr
    canvas.height = window.innerHeight * dpr
}

export function initStatusMsg() {
    socket.on(CONSTANTS.ENDPOINT_CLIENT_CONNECT, function() {
        let alert = document.getElementById("alert")
        alert.style.visibility = "visible" // "hidden"
        alert.style.borderColor = "#1D7755" // green
        alert.innerText = "CONNECTED!"

        document.body.style.opacity = "1";
        document.documentElement.style.opacity = "1";
    })

    socket.on(CONSTANTS.ENDPOINT_CLIENT_DISCONNECT, function() {
        let alert = document.getElementById("alert")
        alert.style.visibility = "visible"
        alert.style.borderColor = "#DB423D" // red
        alert.innerText = "DISCONNECTED!"
    })
}

export function updateLeaderboard() {
    socket.on(CONSTANTS.ENDPOINT_UPDATE_LEADERBOARD, function(bestPlayers: [string, number][]) {
        let table = document.querySelector("#leaderboard > table > tbody")
        table.innerHTML = ""
        for (let i in bestPlayers) {
            let rank = document.createElement("td")
            rank.innerText = "#" + (1 + parseInt(i)).toString()

            let name = document.createElement("td")
            name.innerText = bestPlayers[i][0]

            let score = document.createElement("td")
            score.innerText = bestPlayers[i][1].toString()

            let row = document.createElement("tr")
            row.appendChild(rank)
            row.appendChild(name)
            row.appendChild(score)
            
            table.appendChild(row)
        }
    })
}

export function toMainMenu() {
    socket.emit(CONSTANTS.ENDPOINT_RESET)
    menu.classList.remove("slide-out")
    menu.classList.add("slide-in")

    gameoverMenu.classList.remove("slide-in")
    gameoverMenu.classList.add("slide-out")
}


export function startGame() {
    // TODO: fun name ganerator?
    let name: string = (<HTMLInputElement> document.getElementById("name")).value || "Placeholder"
    socket.emit(CONSTANTS.ENDPOINT_GAME_INIT, name)
}
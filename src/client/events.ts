import { socket } from "./networking"
import * as CONSTANTS from "./../shared/constants"

const menu = document.getElementById("menu")
const gameoverMenu = document.getElementById("gameover-menu")
const canvasMain = <HTMLCanvasElement> document.getElementById("canvas-main")
const ctxMain: CanvasRenderingContext2D = canvasMain.getContext("2d")
const canvasFX = <HTMLCanvasElement> document.getElementById("canvas-fx")
const nameInput = <HTMLInputElement> document.getElementById("name")

export function preventMotion(event: any) {
    window.scrollTo(0, 0)
    event.preventDefault()
    event.stopPropagation()

    // disable zoom
    // 107 Num Key  +
    // 109 Num Key  -
    // 173 Min Key  hyphen/underscore key
    // 61 Plus key  +/= key
    /*if (event.ctrlKey && (event.which === '61' || event.which === '107' || event.which === '173' || event.which === '109'  || event.which === '187'  || event.which === '189')) {
        event.preventDefault();
    }*/
}

export function initMainMenu() {
    menu.classList.remove("slide-out")
    menu.classList.add("slide-in")
    gameoverMenu.classList.remove("slide-in")
    gameoverMenu.classList.add("slide-out")

    socket.emit(CONSTANTS.Endpoint.RESET)
    nameInput.placeholder = localStorage.getItem("name")
}

export function initGameoverMenu(name: string, score: number) {
    menu.classList.remove("slide-in")
    menu.classList.add("slide-out")
    gameoverMenu.classList.remove("slide-out")
    gameoverMenu.classList.add("slide-in")
    document.getElementById("gameover-title").innerText = "GAME OVER!"
    document.getElementById("eaten-by").innerText = name
    document.getElementById("score").innerText = score.toString()
}

export function initDisconnectedMenu(name: string, score: number) {
    menu.classList.remove("slide-in")
    menu.classList.add("slide-out")
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
    canvasMain.style.width = `${window.innerWidth}px`
    canvasMain.style.height = `${window.innerHeight}px`
    canvasFX.style.width = `${window.innerWidth}px`
    canvasFX.style.height = `${window.innerHeight}px`

    // set the dimensions of the coordinate system used by the canvas - https://stackoverflow.com/a/2588404/5583289
    // (doesn't affect the actual size on screen I think)
    // because this is larger than the size on screen (when dpr > 1), it'll get scaled back down to normal
    // (while retaining the sharpness of all the physical pixels within each CSS pixel)
    canvasMain.width = window.innerWidth * dpr
    canvasMain.height = window.innerHeight * dpr
    canvasFX.width = CONSTANTS.RIPPLE_TRUE_WIDTH
    canvasFX.height = CONSTANTS.RIPPLE_TRUE_HEIGHT

    ctxMain.restore()
    ctxMain.font = CONSTANTS.CANVAS_FONT
    ctxMain.lineJoin = "round"
    let size = Math.max(canvasMain.width / CONSTANTS.VISIBLE_WIDTH, canvasMain.height / CONSTANTS.VISIBLE_HEIGHT)
    ctxMain.translate(canvasMain.width / 2, canvasMain.height / 2)
    ctxMain.scale(size, size)
    ctxMain.save()
}

export function initStatusMsg() {
    socket.on(CONSTANTS.Endpoint.CLIENT_CONNECT, function() {
        let alert = document.getElementById("alert")
        alert.style.visibility = "visible" // "hidden"
        alert.style.borderColor = "#1D7755" // green
        alert.innerText = "CONNECTED!"

        document.body.style.opacity = "1";
        document.documentElement.style.opacity = "1";
    })

    socket.on(CONSTANTS.Endpoint.CLIENT_DISCONNECT, function() {
        let alert = document.getElementById("alert")
        alert.style.visibility = "visible"
        alert.style.borderColor = "#DB423D" // red
        alert.innerText = "DISCONNECTED!"
    })
}

export function updateLeaderboard() {
    socket.on(CONSTANTS.Endpoint.UPDATE_LEADERBOARD, function(bestPlayers: [string, number][]) {
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



export function startGame() {
    // TODO: fun name ganerator?
    let name: string = nameInput.value || localStorage.getItem("name")
    localStorage.setItem("name", name)
    socket.emit(CONSTANTS.Endpoint.GAME_INIT, name)
}
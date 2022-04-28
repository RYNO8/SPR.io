import { socket } from "./networking"
import * as CONSTANTS from "./../shared/constants"

const menu = document.getElementById("menu")
const gameoverMenu = document.getElementById("gameover-menu")
const canvas = <HTMLCanvasElement> document.getElementById("game-canvas")


// thank you Luke
export function onResize() {
    // get the ratio of physical pixels to CSS pixels
    const dpr = window.devicePixelRatio || 1

    // set the CSS dimensions of the canvas to fill the screen (using CSS pixels)
    canvas.style.width = `${window.outerWidth}px`
    canvas.style.height = `${window.outerHeight}px`

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
        alert.innerHTML = "CONNECTED!"

        document.body.style.opacity = "1";
        document.documentElement.style.opacity = "1";
    })

    socket.on(CONSTANTS.ENDPOINT_CLIENT_DISCONNECT, function() {
        let alert = document.getElementById("alert")
        alert.style.visibility = "visible"
        alert.style.borderColor = "#DB423D" // red
        alert.innerHTML = "DISCONNECTED!"
    })
}

export function toMainMenu() {
    menu.classList.remove("slide-out")
    menu.classList.add("slide-in")

    gameoverMenu.classList.remove("slide-in")
    gameoverMenu.classList.add("slide-out")
}
export function startGame() {
    let name: string = (<HTMLInputElement> document.getElementById("name")).value || "Player"
    socket.emit(CONSTANTS.ENDPOINT_GAME_INIT, name)
}
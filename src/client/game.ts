/*
TODO
 - https://app.brandmark.io/v3/
 - https://diariesofanessexgirl.com/twilight-sunset-color-palette/
 - https://diariesofanessexgirl.com/sunset-surfing-color-palette/
 - http://colormind.io/
    green: #1D7755
    blue: #60ACBC
    white: #FCF5EF
    orange: #F0A879
    red: #DB423D
    greengrey: #AEB495
 - rush mode: 1 player gets powerup, can capture any player
 - changing labyrinth
 - teleports?
 - collaboration in labyrinth?
*/

import { debounce } from "throttle-debounce"
import { startCapturingInput } from "./send"
import { render } from "./render"
import { socket, initStatusMsg } from "./networking"
import * as CONSTANTS from "./../shared/constants"

const canvas = <HTMLCanvasElement> document.getElementById('game-canvas')
// thank you Luke
function onResize() {
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
window.addEventListener("resize", debounce(40, onResize))
onResize()

initStatusMsg()
requestAnimationFrame(render)

let playButton = document.getElementById("play-button")
playButton.onclick = startGame
document.onkeyup = function(event: KeyboardEvent) {
    if (event.code == "Enter") {
        startGame()
    }
}

function startGame() {
    let name: string = (<HTMLInputElement> document.getElementById("name")).value || "Player"
    socket.emit(CONSTANTS.ENDPOINT_GAME_INIT, name)
    startCapturingInput()
}
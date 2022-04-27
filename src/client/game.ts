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
import { startCapturingInput } from "./playerInput"
import { render } from "./render"
import { onResize, initStatusMsg, initGameOver, startGame } from "./events"

startCapturingInput()

requestAnimationFrame(render)

window.addEventListener("resize", debounce(40, onResize))
onResize()

initStatusMsg()

initGameOver()

document.getElementById("play-button").onclick = startGame
document.onkeyup = function(event: KeyboardEvent) {
    if (event.code == "Enter") {
        startGame()
    }
}
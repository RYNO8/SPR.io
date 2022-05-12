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
 - aestetic styling
 - https://x-c3ll.github.io/posts/javascript-antidebugging/

THINK ABOUT
 - powerup to gain (temporary?) wider field of view
 - powerup to gain partial points
 - colour coded gates
*/

import { debounce } from "throttle-debounce"
import { startCapturingInput } from "./playerInput"
import { render } from "./render"
import { onResize, initStatusMsg, updateLeaderboard, initMainMenu, startGame } from "./events"
import * as CONSTANTS from "../shared/constants"

startCapturingInput()

requestAnimationFrame(render)

window.addEventListener("resize", debounce(40, onResize))
onResize()

initStatusMsg()

updateLeaderboard()

localStorage.setItem("name", localStorage.getItem("name") || CONSTANTS.NAME_PLACEHOLDER)
initMainMenu()
document.getElementById("back-button").onclick = initMainMenu

document.getElementById("play-button").onclick = startGame
document.getElementById("play-button-2").onclick = startGame
document.onkeyup = function(event: KeyboardEvent) {
    if (event.code == "Enter") {
        startGame()
    }
}
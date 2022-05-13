/*
BUGS
 - disable zoom
 - glitch into wall corners (increase MAZE_OVERLAP?)
 - when maze wall spawns, you get stuck inside if you are on the edge (check wall collisions on each player update)

TODO
 - rooms
 - game modes
 - colour coded gates
 - teleports?
 - style
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
 - https://x-c3ll.github.io/posts/javascript-antidebugging/
 - SEO

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

window.addEventListener("scroll", preventMotion, false);
window.addEventListener("touchmove", preventMotion, false);
window.addEventListener("touchstart", preventMotion, false);

function preventMotion(event: any) {
    window.scrollTo(0, 0);
    event.preventDefault();
    event.stopPropagation();
}

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
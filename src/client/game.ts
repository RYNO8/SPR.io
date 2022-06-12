import { debounce } from "throttle-debounce"
import { startCapturingInput } from "./playerInput"
import { render } from "./render"
import { preventMotion, onResize, initStatusMsg, updateLeaderboard, initMainMenu, startGame } from "./events"
import * as CONSTANTS from "../shared/constants"

// diable scrolling & zooming
document.addEventListener("scroll", preventMotion, { passive: false })
//document.addEventListener("touchmove", preventMotion, { passive: false })
document.addEventListener("mousewheel", preventMotion, { passive: false })
document.addEventListener("DOMMouseScroll", preventMotion, { passive: false })
document.addEventListener("wheel", preventMotion, { passive: false })
document.addEventListener('contextmenu', preventMotion, { passive: false})

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
    if (event.code === "Enter") {
        startGame()
    }
}
import { debounce } from "throttle-debounce"
import { startCapturingInput } from "./playerInput"
import { render } from "./render"
import { onResize, initStatusMsg, updateLeaderboard, initMainMenu, startGame } from "./events"
import * as CONSTANTS from "../shared/constants"

// diable scrolling & zooming
document.addEventListener("scroll", preventMotion, { passive: false })
document.addEventListener("touchmove", preventMotion, { passive: false })
document.addEventListener("mousewheel", preventMotion, { passive: false })
document.addEventListener("DOMMouseScroll", preventMotion, { passive: false })
document.addEventListener("wheel", preventMotion, { passive: false })
document.addEventListener('contextmenu', preventMotion, { passive: false})


function preventMotion(event: any) {
    window.scrollTo(0, 0)
    event.preventDefault()
    event.stopPropagation()

    // 107 Num Key  +
    // 109 Num Key  -
    // 173 Min Key  hyphen/underscore key
    // 61 Plus key  +/= key
    if (event.ctrlKey && (event.which === '61' || event.which === '107' || event.which === '173' || event.which === '109'  || event.which === '187'  || event.which === '189')) {
        event.preventDefault();
    }
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
    if (event.code === "Enter") {
        startGame()
    }
}
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
 - boost with cooldown?
 - changing labyrinth?
*/

import { startCapturingInput } from "./send"
import { startRendering } from "./render"
import { socket, initStatusMsg } from "./networking"
import * as CONSTANTS from "./../shared/constants"

initStatusMsg()
startRendering()

let playButton = document.getElementById("play-button")
let menu = document.getElementById("menu")
playButton.onclick = startGame
menu.onkeyup = function(event : KeyboardEvent) {
    if (event.code == "Enter") {
        startGame()
    }
}

function startGame() {
    let name : string = (<HTMLInputElement> document.getElementById("name")).value || "Player"
    socket.emit(CONSTANTS.ENDPOINT_GAME_INIT, name)
    startCapturingInput()
}
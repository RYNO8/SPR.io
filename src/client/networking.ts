import { io, Socket } from "socket.io-client"
import * as CONSTANTS from "./../shared/constants"
export const socket = io()

export function initStatusMsg() {
    socket.on(CONSTANTS.ENDPOINT_CLIENT_CONNECT, function() {
        let alert = document.getElementById("alert")
        alert.style.visibility = "visible" // "hidden"
        alert.style.borderColor = "#1D7755" // green
        alert.innerHTML = "CONNECTED!"
    })

    socket.on(CONSTANTS.ENDPOINT_CLIENT_DISCONNECT, function() {
        let alert = document.getElementById("alert")
        alert.style.visibility = "visible"
        alert.style.borderColor = "#DB423D" // red
        alert.innerHTML = "DISCONNECTED!"
    })
}
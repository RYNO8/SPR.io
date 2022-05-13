import { socket } from "./networking"
import * as CONSTANTS from "../shared/constants"
import { throttle } from "throttle-debounce"

export let direction: number

let updateDirection = throttle(CONSTANTS.CLIENT_SEND_RATE, () => {
    socket.emit(CONSTANTS.Endpoint.UPDATE_DIRECTION, direction)
})

function handleInput(x: number, y: number) {
    x -= window.innerWidth / 2
    y -= window.innerHeight / 2

    direction = Math.atan2(y, x)
    updateDirection()

    //const dist = Math.sqrt(x * x + y * y)
    //socket.emit(CONSTANTS.Endpoint.UPDATE_SPEED, dir)
}

function onMouseInput(e: any) {
    handleInput(e.clientX, e.clientY)
}

function onTouchInput(e: any) {
    const touch = e.touches[0];
    handleInput(touch.clientX, touch.clientY)
}

export function startCapturingInput() {
    window.addEventListener('mousemove', onMouseInput)
    window.addEventListener('click', onMouseInput)
    window.addEventListener('touchstart', onTouchInput)
    window.addEventListener('touchmove', onTouchInput)
}

/*export function stopCapturingInput() {
    window.removeEventListener('mousemove', onMouseInput)
    window.removeEventListener('click', onMouseInput)
    window.removeEventListener('touchstart', onTouchInput)
    window.removeEventListener('touchmove', onTouchInput)
}*/
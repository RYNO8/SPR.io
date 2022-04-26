import * as CONSTANTS from "../constants"
import { GameObject } from "./game_object"

export class Powerup extends GameObject {
    public time: number
    public x: number
    public y: number

    constructor() {
        super()
        this.time = Date.now()
    }
}

export function copyPowerup(powerup : Powerup) {
    let output : Powerup = new Powerup()
    output.time = powerup.time
    output.x = powerup.x
    output.y = powerup.y
    return output
}
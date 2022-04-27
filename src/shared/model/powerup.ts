import * as CONSTANTS from "../constants"
import { GameObject } from "./game_object"

export class Powerup extends GameObject {
    public time: number
    public x: number
    public y: number

    constructor(x: number, y: number) {
        super(x, y)
        this.time = Date.now()
    }
}

export function copyPowerup(powerup : Powerup) {
    let output : Powerup = new Powerup(powerup.x, powerup.y)
    output.time = powerup.time
    return output
}
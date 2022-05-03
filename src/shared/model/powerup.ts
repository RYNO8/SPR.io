import * as CONSTANTS from "../constants"
import { GameObject } from "./game_object"
import { Position } from "./position"
export class Powerup extends GameObject {
    public time: number

    constructor(centroid: Position) {
        super(centroid)
        this.time = Date.now()
    }

    static deserialise(powerup : Powerup) {
        let output : Powerup = new Powerup(Position.deserialise(powerup.centroid))
        output.time = powerup.time
        return output
    }
}

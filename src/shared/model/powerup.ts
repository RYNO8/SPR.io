import * as CONSTANTS from "../constants"
import { GameObject } from "./game_object"

export class Powerup extends GameObject {
    public time : number
    public x : number
    public y : number

    constructor() {
        super()
        this.time = Date.now()
    }

    
}
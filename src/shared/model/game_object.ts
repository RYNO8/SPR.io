import * as CONSTANTS from "./../constants"
import { Position, sub } from "./position"

export class GameObject {
    public centroid: Position

    constructor(centroid: Position) {
        this.centroid = centroid
    }

    static deserialise(gameObject: GameObject) {
        return new GameObject(Position.deserialise(gameObject.centroid))
    }

    canAttack(o: GameObject) {
        return sub(this.centroid, o.centroid).quadrance() <= 2 * CONSTANTS.PLAYER_RADIUS * CONSTANTS.PLAYER_RADIUS
    }
}
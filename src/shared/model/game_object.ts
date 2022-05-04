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

    isVisible(o: GameObject) {
        if(process.env.MAPVIEWTEST) {
            return true;
        }
        if (o == null) return true
        return (
            Math.abs(o.centroid.x - this.centroid.x) <= CONSTANTS.VISIBLE_WIDTH / 2 + CONSTANTS.VISIBLE_BUFFER && 
            Math.abs(o.centroid.y - this.centroid.y) <= CONSTANTS.VISIBLE_HEIGHT / 2 + CONSTANTS.VISIBLE_BUFFER
        )
    }
}
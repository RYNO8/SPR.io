import { GameObject } from "./game_object"
import { Position, add, pointLineDist } from "./position"

export class Obstacle extends GameObject {
    public points: Position[] = []

    constructor(points: Position[]) {
        //console.assert(points.length >= 3)
        super(points.reduce(function(p1: Position, p2: Position) {
            return add(p1, p2)
        }).scale(1 / points.length))
        
        // assuming points are in (clockwise?) order
        this.points = points
    }

    static deserialise(obstacle: Obstacle) {
        return new Obstacle(obstacle.points.map(Position.deserialise))
    }

    clamp(p: Position) {
        for (let i = 0; i < this.points.length; i++) {
            let j = (i + 1) % this.points.length
            console.log(pointLineDist(p, this.points[i], this.points[j]))
        }
        console.log(".")
        return p
    }
}
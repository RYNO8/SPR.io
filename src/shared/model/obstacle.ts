import { GameObject } from "./game_object"
import { Position, add, sub, lineLineIntersection } from "./position"

export class Obstacle extends GameObject {
    public points: Position[] = []
    public dirs: Position[] = []

    constructor(points: Position[]) {
        //console.assert(points.length >= 3)
        super(points.reduce(function(p1: Position, p2: Position) {
            return add(p1, p2)
        }).scale(1 / points.length))
        
        // assuming points are in (clockwise?) order
        this.points = points
        for (let i = 0; i < points.length; i++) {
            let j = (i + 1) % points.length
            this.dirs.push(sub(points[j], points[i]))
        }
    }

    static deserialise(obstacle: Obstacle) {
        return new Obstacle(obstacle.points.map(Position.deserialise))
    }

    // TODO: find if pos is within region
    covers(pos: Position) {
        return false
    }

    // TODO
    rayTrace(startPos: Position, dirVec: Position): [number, Position, Position] {
        let best: [number, Position, Position] = [1, startPos, dirVec]
        for (let i = 0; i < this.points.length; i++) {
            let intersection = lineLineIntersection(startPos, dirVec, this.points[i], this.dirs[i])
            if (intersection[0] < best[0]) {
                best = intersection
            }
        }
        return best
    }

    exportObstacle() {
        let output = new Obstacle(this.points)
        output.dirs = []
        return output
    }
}

export function makeSquareObstacle(topLeft: Position, width: number, height: number) {
    return new Obstacle([
        add(topLeft, new Position(-1, -1)),
        add(topLeft, new Position(-1, height + 2)),
        add(topLeft, new Position(width + 2, height + 2)),
        add(topLeft, new Position(width + 2, -1))
    ])
}

export function makeTriangleObstacle(topLeft: Position, width: number, height: number, isRight: boolean, isBottom: boolean) {
    let points: Position[] = []
    if (!isRight || !isBottom) {
        points.push(add(topLeft, new Position(1, 1)))
    }
    if (!isRight || isBottom) {
        points.push(add(topLeft, new Position(1, height - 2)))
    }
    if (isRight || isBottom) {
        points.push(add(topLeft, new Position(width - 2, height - 2)))
    }
    if (isRight || !isBottom) {
        points.push(add(topLeft, new Position(width - 2, 1)))
    }
    return new Obstacle(points)
}
import { GameObject } from "./game_object"
import { Position, add, sub, findAvg, lineLineIntersection } from "./position"

export class Obstacle extends GameObject {
    public points: Position[] = []
    public dirs: Position[] = []

    constructor(points: Position[]) {
        //console.assert(points.length >= 3)
        super(findAvg(points))
        
        // assuming points are in anticlockwise? order
        this.points = points
        for (let i = 0; i < points.length; i++) {
            let j = (i + 1) % points.length
            this.dirs.push(sub(points[j], points[i]))
        }
    }

    static deserialise(obstacle: Obstacle) {
        return new Obstacle(obstacle.points.map(Position.deserialise))
    }

    covers(pos: Position) {
        let inside = false
        for (let i = 0; i < this.points.length; i++) {
            let j = (i + 1) % this.points.length
            if ((this.points[i].y > pos.y) != (this.points[j].y > pos.y) && pos.x < (pos.y - this.points[i].y) * this.dirs[i].x / this.dirs[i].y + this.points[i].x) {
                inside = !inside
            }
        }
        return inside
    }

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
        add(topLeft, new Position(width + 1, -1)),
        add(topLeft, new Position(width + 1, height + 1)),
        add(topLeft, new Position(-1, height + 1)),
    ])
}

export function makeTriangleObstacle(topLeft: Position, width: number, height: number, isRight: boolean, isBottom: boolean) {
    /*if (!isRight && !isBottom) {
        return new Obstacle([
            add(topLeft, new Position(-1, -1)),
            add(topLeft, new Position(width + 3, -1)),
            add(topLeft, new Position(-1, height + 3)),
        ])
    } else if (!isRight && isBottom) {
        return new Obstacle([
            add(topLeft, new Position(-1, height + 1)),
            add(topLeft, new Position(width + 3, height + 1)),
            add(topLeft, new Position(-1, -3)),
        ])
    } else if (isRight && !isBottom) {
        return new Obstacle([
            add(topLeft, new Position(width + 1, -1)),
            add(topLeft, new Position(-3, -1)),
            add(topLeft, new Position(width + 1, height + 3)),
        ])
    } else if (isRight && isBottom) {
        return new Obstacle([
            add(topLeft, new Position(width + 1, height + 1)),
            add(topLeft, new Position(width + 1, -3)),
            add(topLeft, new Position(-3, height + 1)),
        ])
    }*/
    if (!isRight && !isBottom) {
        return new Obstacle([
            add(topLeft, new Position(-1, -1)),
            add(topLeft, new Position(width + 1, -1)),
            add(topLeft, new Position(width + 1, 0)),
            add(topLeft, new Position(0, height + 1)),
            add(topLeft, new Position(-1, height + 1))
        ])
    } else if (!isRight && isBottom) {
        return new Obstacle([
            add(topLeft, new Position(-1, height + 1)),
            add(topLeft, new Position(width + 1, height + 1)),
            add(topLeft, new Position(width + 1, height)),
            add(topLeft, new Position(0, -1)),
            add(topLeft, new Position(-1, -1)),
        ])
    } else if (isRight && !isBottom) {
        return new Obstacle([
            add(topLeft, new Position(width + 1, -1)),
            add(topLeft, new Position(-1, -1)),
            add(topLeft, new Position(-1, 0)),
            add(topLeft, new Position(width, height + 1)),
            add(topLeft, new Position(width + 1, height + 1)),
        ])
    } else if (isRight && isBottom) {
        return new Obstacle([
            add(topLeft, new Position(width + 1, height + 1)),
            add(topLeft, new Position(width + 1, -1)),
            add(topLeft, new Position(width, -1)),
            add(topLeft, new Position(-1, height)),
            add(topLeft, new Position(-1, height + 1)),
        ])
    }
}
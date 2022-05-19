import * as CONSTANTS from "../constants"
import { GameObject } from "./game_object"
import { Position, add, sub, findAvg, lineLineIntersection } from "./position"

export class Obstacle extends GameObject {
    public time: number = 0
    public points: Position[] = []
    public interiorPoints: Position[] = []
    public dirs: Position[] = []
    public minX = Infinity
    public maxX = -Infinity
    public minY = Infinity
    public maxY = -Infinity

    constructor(time: number, points: Position[], interiorPoints: Position[]) {
        super(findAvg(points))
        
        this.time = time
        console.assert(points.length >= 3) // and assuming points are in anticlockwise? order
        this.points = points
        this.interiorPoints = interiorPoints
        for (let i = 0; i < points.length; i++) {
            let j = (i + 1) % points.length
            this.dirs.push(sub(points[j], points[i]))
        }

        for (let i = 0; i < this.points.length; i++) {
            this.minX = Math.min(this.minX, this.points[i].x)
            this.maxX = Math.max(this.maxX, this.points[i].x)
            this.minY = Math.min(this.minY, this.points[i].y)
            this.maxY = Math.max(this.maxY, this.points[i].y)
        }
    }

    static deserialise(obstacle: Obstacle) {
        return new Obstacle(obstacle.time, obstacle.points.map(Position.deserialise), obstacle.interiorPoints.map(Position.deserialise))
    }

    covers(pos: Position) {
        let inside = false
        if (this.time <= Date.now()) {
            
            if (pos.x < this.minX || pos.x > this.maxX || pos.y < this.minY || pos.y > this.maxY) return false
            
            for (let i = 0; i < this.points.length; i++) {
                let j = (i + 1) % this.points.length
                if ((this.points[i].y > pos.y) != (this.points[j].y > pos.y) && pos.x < (pos.y - this.points[i].y) * this.dirs[i].x / this.dirs[i].y + this.points[i].x) {
                    inside = !inside
                }
            }
        }
        return inside
    }

    rayTrace(startPos: Position, dirVec: Position): [number, Position, Position] {
        let best: [number, Position, Position] = [1, startPos, dirVec]
        if (this.time <= Date.now()) {
            for (let i = 0; i < this.points.length; i++) {
                let intersection = lineLineIntersection(startPos, dirVec, this.points[i], this.dirs[i])
                if (intersection[0] <= best[0]) {
                    if (best[0] <= 0.02) intersection[2] = new Position(0, 0)
                    best = intersection
                }
            }
        }
        return best
    }

    exportObstacle() {
        let output = new Obstacle(this.time, this.points, this.interiorPoints)
        output.dirs = []
        return output
    }
}

export function makeSquareObstacle(time: number, topLeft: Position, width: number, height: number) {
    return new Obstacle(time, [
        add(topLeft, new Position(0, -CONSTANTS.MAZE_OVERLAP)),
        add(topLeft, new Position(width, -CONSTANTS.MAZE_OVERLAP)),
        add(topLeft, new Position(width + CONSTANTS.MAZE_OVERLAP, 0)),
        add(topLeft, new Position(width + CONSTANTS.MAZE_OVERLAP, height)),
        add(topLeft, new Position(width, height + CONSTANTS.MAZE_OVERLAP)),
        add(topLeft, new Position(0, height + CONSTANTS.MAZE_OVERLAP)),
        add(topLeft, new Position(-CONSTANTS.MAZE_OVERLAP, height)),
        add(topLeft, new Position(-CONSTANTS.MAZE_OVERLAP, 0)),
    ], [
        add(topLeft, new Position(0, 0)),
        add(topLeft, new Position(width, 0)),
        add(topLeft, new Position(width, height)),
        add(topLeft, new Position(0, height))
    ])
}

export function makeTriangleObstacle(time: number, topLeft: Position, width: number, height: number, isRight: boolean, isBottom: boolean) {
    if (!isRight && !isBottom) {
        return new Obstacle(time, [
            add(topLeft, new Position(-CONSTANTS.MAZE_OVERLAP, -CONSTANTS.MAZE_OVERLAP)),
            add(topLeft, new Position(width + CONSTANTS.MAZE_OVERLAP, -CONSTANTS.MAZE_OVERLAP)),
            add(topLeft, new Position(width + CONSTANTS.MAZE_OVERLAP, CONSTANTS.MAZE_OVERLAP)),
            add(topLeft, new Position(CONSTANTS.MAZE_OVERLAP, height + CONSTANTS.MAZE_OVERLAP)),
            add(topLeft, new Position(-CONSTANTS.MAZE_OVERLAP, height + CONSTANTS.MAZE_OVERLAP))
        ], [
            add(topLeft, new Position(0, 0)),
            add(topLeft, new Position(width, 0)),
            add(topLeft, new Position(0, height))
        ])
    } else if (!isRight && isBottom) {
        return new Obstacle(time, [
            add(topLeft, new Position(-CONSTANTS.MAZE_OVERLAP, height + CONSTANTS.MAZE_OVERLAP)),
            add(topLeft, new Position(width + CONSTANTS.MAZE_OVERLAP, height + CONSTANTS.MAZE_OVERLAP)),
            add(topLeft, new Position(width + CONSTANTS.MAZE_OVERLAP, height - CONSTANTS.MAZE_OVERLAP)),
            add(topLeft, new Position(CONSTANTS.MAZE_OVERLAP, -CONSTANTS.MAZE_OVERLAP)),
            add(topLeft, new Position(-CONSTANTS.MAZE_OVERLAP, -CONSTANTS.MAZE_OVERLAP)),
        ], [
            add(topLeft, new Position(0, height)),
            add(topLeft, new Position(width, height)),
            add(topLeft, new Position(0, 0))
        ])
    } else if (isRight && !isBottom) {
        return new Obstacle(time, [
            add(topLeft, new Position(width + CONSTANTS.MAZE_OVERLAP, -CONSTANTS.MAZE_OVERLAP)),
            add(topLeft, new Position(-CONSTANTS.MAZE_OVERLAP, -CONSTANTS.MAZE_OVERLAP)),
            add(topLeft, new Position(-CONSTANTS.MAZE_OVERLAP, CONSTANTS.MAZE_OVERLAP)),
            add(topLeft, new Position(width - CONSTANTS.MAZE_OVERLAP, height + CONSTANTS.MAZE_OVERLAP)),
            add(topLeft, new Position(width + CONSTANTS.MAZE_OVERLAP, height + CONSTANTS.MAZE_OVERLAP)),
        ], [
            add(topLeft, new Position(width, 0)),
            add(topLeft, new Position(0, 0)),
            add(topLeft, new Position(width, height))
        ])
    } else if (isRight && isBottom) {
        return new Obstacle(time, [
            add(topLeft, new Position(width + CONSTANTS.MAZE_OVERLAP, height + CONSTANTS.MAZE_OVERLAP)),
            add(topLeft, new Position(width + CONSTANTS.MAZE_OVERLAP, -CONSTANTS.MAZE_OVERLAP)),
            add(topLeft, new Position(width - CONSTANTS.MAZE_OVERLAP, -CONSTANTS.MAZE_OVERLAP)),
            add(topLeft, new Position(-CONSTANTS.MAZE_OVERLAP, height - CONSTANTS.MAZE_OVERLAP)),
            add(topLeft, new Position(-CONSTANTS.MAZE_OVERLAP, height + CONSTANTS.MAZE_OVERLAP)),
        ], [
            add(topLeft, new Position(width, height)),
            add(topLeft, new Position(width, 0)),
            add(topLeft, new Position(0, height)),
        ])
    }
}

/*export function makeTriangleObstacle2(time: number, topLeft: Position, width: number, height: number, isRight: boolean, isBottom: boolean) {
    if (!isRight && !isBottom) {
        return new Obstacle(time, [
            add(topLeft, new Position(-CONSTANTS.MAZE_OVERLAP, -CONSTANTS.MAZE_OVERLAP)),
            add(topLeft, new Position(width + CONSTANTS.MAZE_OVERLAP, -CONSTANTS.MAZE_OVERLAP)),
            add(topLeft, new Position(-CONSTANTS.MAZE_OVERLAP, height + CONSTANTS.MAZE_OVERLAP))
        ])
    } else if (!isRight && isBottom) {
        return new Obstacle(time, [
            add(topLeft, new Position(-CONSTANTS.MAZE_OVERLAP, height + CONSTANTS.MAZE_OVERLAP)),
            add(topLeft, new Position(width + CONSTANTS.MAZE_OVERLAP, height + CONSTANTS.MAZE_OVERLAP)),
            add(topLeft, new Position(-CONSTANTS.MAZE_OVERLAP, -CONSTANTS.MAZE_OVERLAP)),
        ])
    } else if (isRight && !isBottom) {
        return new Obstacle(time, [
            add(topLeft, new Position(width + CONSTANTS.MAZE_OVERLAP, -CONSTANTS.MAZE_OVERLAP)),
            add(topLeft, new Position(-CONSTANTS.MAZE_OVERLAP, -CONSTANTS.MAZE_OVERLAP)),
            add(topLeft, new Position(width + CONSTANTS.MAZE_OVERLAP, height + CONSTANTS.MAZE_OVERLAP)),
        ])
    } else if (isRight && isBottom) {
        return new Obstacle(time, [
            add(topLeft, new Position(width + CONSTANTS.MAZE_OVERLAP, height + CONSTANTS.MAZE_OVERLAP)),
            add(topLeft, new Position(width + CONSTANTS.MAZE_OVERLAP, -CONSTANTS.MAZE_OVERLAP)),
            add(topLeft, new Position(-CONSTANTS.MAZE_OVERLAP, height + CONSTANTS.MAZE_OVERLAP)),
        ])
    }
}*/
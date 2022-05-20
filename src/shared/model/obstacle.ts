import * as CONSTANTS from "../constants"
import { GameObject } from "./game_object"
import { Position, add, sub, findAvg, lineLineIntersection } from "./position"

export class Obstacle extends GameObject {
    public startTime: number = 0
    public endTime: number = 0
    public points: Position[] = []
    public interiorPoints: Position[] = []
    public dirs: Position[] = []
    public minX = Infinity
    public maxX = -Infinity
    public minY = Infinity
    public maxY = -Infinity

    constructor(points: Position[], interiorPoints: Position[]) {
        super(findAvg(points))
        
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
        let output = new Obstacle(obstacle.points.map(Position.deserialise), obstacle.interiorPoints.map(Position.deserialise))
        output.startTime = obstacle.startTime
        output.endTime = obstacle.endTime
        return output
    }

    existsBefore(time: number) {
        return this.startTime <= this.endTime && this.endTime < time
    }

    existsAt(time: number) {
        return this.startTime <= time && time <= this.endTime
        //return this.endTime === CONSTANTS.MAX_TIMESTAMP
    }

    existsAfter(time: number) {
        return time < this.startTime && this.startTime <= this.endTime
    }

    add() {
        // if obstacle exists only in the past, it makes sense to add it to the future
        // adding is not a redundant
        if (this.existsBefore(Date.now())) {
            this.startTime = Date.now() + CONSTANTS.MAZE_CHANGE_DELAY
            this.endTime = CONSTANTS.MAX_TIMESTAMP
        }
    }

    remove() {
        // if obstacle exists in the present or future, it makes sense to remove it
        if (this.existsAt(Date.now()) || this.existsAfter(Date.now())) {
            this.endTime = Date.now() + CONSTANTS.MAZE_CHANGE_DELAY
        }
    }

    setTo(exists: boolean) {
        if (exists) this.add()
        else this.remove()
    }

    covers(pos: Position) {
        if (pos.x < this.minX || pos.x > this.maxX || pos.y < this.minY || pos.y > this.maxY) return false
        
        let inside = false
        for (let i = 0; i < this.points.length; i++) {
            let j = (i + 1) % this.points.length
            if ((this.points[i].y > pos.y) !== (this.points[j].y > pos.y) && pos.x < (pos.y - this.points[i].y) * this.dirs[i].x / this.dirs[i].y + this.points[i].x) {
                inside = !inside
            }
        }
        return inside
    }

    rayTrace(startPos: Position, dirVec: Position): [number, Position, Position] {
        let best: [number, Position, Position] = [1, startPos, dirVec]
        for (let i = 0; i < this.points.length; i++) {
            let intersection = lineLineIntersection(startPos, dirVec, this.points[i], this.dirs[i])
            if (intersection[0] <= best[0]) {
                if (best[0] <= 0.02) intersection[2] = new Position(0, 0)
                best = intersection
            }
        }
        return best
    }

    exportObstacle() {
        let output = new Obstacle(this.points, this.interiorPoints)
        output.startTime = this.startTime
        output.endTime = this.endTime
        output.dirs = []
        return output
    }
}

export function makeSquare(mazePos: Position, width: number, height: number) {
    let topLeft = mazePos.scale(CONSTANTS.CELL_SIZE)
    return new Obstacle([
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

export function makeTriangle(mazePos: Position, size: number, isRight: boolean, isBottom: boolean) {
    let center = add(mazePos, new Position(1/2, 1/2)).scale(CONSTANTS.CELL_SIZE)
    let factor = new Position(isRight ? +1 : -1, isBottom ? +1 : -1)
    let val1 = CONSTANTS.CELL_SIZE / 2 + CONSTANTS.MAZE_OVERLAP
    let val2 = CONSTANTS.CELL_SIZE / 2 - size - CONSTANTS.MAZE_OVERLAP
    let val3 = CONSTANTS.CELL_SIZE / 2 - CONSTANTS.MAZE_OVERLAP
    let points: Position[] = [
        add(center, new Position(val1, val1).stretch(factor)),
        add(center, new Position(val1, val2).stretch(factor)),
        add(center, new Position(val3, val2).stretch(factor)),
        add(center, new Position(val2, val3).stretch(factor)),
        add(center, new Position(val2, val1).stretch(factor))
    ]
    let interiorPoints: Position[] = [
        add(center, new Position(CONSTANTS.CELL_SIZE / 2, CONSTANTS.CELL_SIZE / 2).stretch(factor)),
        add(center, new Position(CONSTANTS.CELL_SIZE / 2 - size, CONSTANTS.CELL_SIZE / 2).stretch(factor)),
        add(center, new Position(CONSTANTS.CELL_SIZE / 2, CONSTANTS.CELL_SIZE / 2 - size).stretch(factor))
    ]
    return new Obstacle(points, interiorPoints)
}
import * as CONSTANTS from "../constants"
import { GameObject } from "./game_object"
import { Position, add, sub, findAvg, lineLineIntersection } from "./position"
import { MazeBase } from "./maze"

export type ClientObstacle = [number, number, number, number[], number[]]

export class Obstacle extends GameObject {
    public startTime: number[] = new Array(CONSTANTS.NUM_TEAMS).fill(0)
    public endTime: number[] = new Array(CONSTANTS.NUM_TEAMS).fill(0)
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
        for (let i = 0; i < points.length; ++i) {
            const j = (i + 1) % points.length
            this.dirs.push(sub(points[j], points[i]))
        }

        for (let i = 0; i < this.points.length; ++i) {
            this.minX = Math.min(this.minX, this.points[i].x)
            this.maxX = Math.max(this.maxX, this.points[i].x)
            this.minY = Math.min(this.minY, this.points[i].y)
            this.maxY = Math.max(this.maxY, this.points[i].y)
        }
    }

    static deserialiseObstacle(obstacle: ClientObstacle) {
        const output = makeObstacle(new Position(obstacle[1], obstacle[0]), obstacle[2])
        output.startTime = obstacle[3]
        output.endTime = obstacle[4]
        return output
    }

    existsBefore(time: number, team?: number) {
        if (team !== undefined) {
            return this.startTime[team] <= this.endTime[team] && this.endTime[team] < time
        } else {
            for (let team = 0; team < CONSTANTS.NUM_TEAMS; ++team) {
                if (this.existsBefore(time, team)) {
                    return true
                }
            }
            return false
        }
    }

    existsAt(time: number, team?: number) {
        if (team !== undefined) {
            return this.startTime[team] <= time && time <= this.endTime[team]
        } else {
            for (let team = 0; team < CONSTANTS.NUM_TEAMS; ++team) {
                if (this.existsAt(time, team)) {
                    return true
                }
            }
            return false
        }
    }

    existsAfter(time: number, team?: number) {
        if (team !== undefined) {
            return time < this.startTime[team] && this.startTime[team] <= this.endTime[team]
        } else {
            for (let team = 0; team < CONSTANTS.NUM_TEAMS; ++team) {
                if (this.existsAfter(time, team)) {
                    return true
                }
            }
            return false
        }
    }

    add(team?: number) {
        // if obstacle exists only in the past, it makes sense to add it to the future
        // adding is not a redundant
        if (team !== undefined) {
            if (this.existsBefore(Date.now(), team)) {
                this.startTime[team] = Date.now() + CONSTANTS.MAZE_CHANGE_DELAY
                this.endTime[team] = CONSTANTS.MAX_TIMESTAMP
            }
        } else {
            for (let team = 0; team < CONSTANTS.NUM_TEAMS; ++team) {
                this.add(team)
            }
        }
    }

    remove(team?: number) {
        // if obstacle exists in the present or future, it makes sense to remove it
        if (team !== undefined) {
            if (this.existsAt(Date.now(), team) || this.existsAfter(Date.now(), team)) {
                this.endTime[team] = Date.now() + CONSTANTS.MAZE_CHANGE_DELAY
            }
        } else {
            for (let team = 0; team < CONSTANTS.NUM_TEAMS; ++team) {
                this.remove(team)
            }
        }
    }

    setTo(exists: boolean, team?: number) {
        if (team !== undefined) {
            if (exists) this.add(team)
            else this.remove(team)
        } else {
            for (let team = 0; team < CONSTANTS.NUM_TEAMS; ++team) {
                this.setTo(exists, team)
            }
        }
    }

    setSome(teams: number[]) {
        for (let team = 0; team < CONSTANTS.NUM_TEAMS; ++team) {
            this.setTo(teams.includes(team), team)
        }
    }

    covers(pos: Position, team?: number) {
        if (!this.existsAt(Date.now(), team)) return false
        if (pos.x < this.minX || pos.x > this.maxX || pos.y < this.minY || pos.y > this.maxY) return false
        
        let inside = false
        for (let i = 0; i < this.points.length; ++i) {
            const j = (i + 1) % this.points.length
            if ((this.points[i].y > pos.y) !== (this.points[j].y > pos.y) && pos.x < (pos.y - this.points[i].y) * this.dirs[i].x / this.dirs[i].y + this.points[i].x) {
                inside = !inside
            }
        }
        return inside
    }

    rayTrace(startPos: Position, dirVec: Position, team?: number): [number, Position, Position] {
        let best: [number, Position, Position] = [1, startPos, dirVec]
        if (!this.existsAt(Date.now(), team)) return best

        for (let i = 0; i < this.points.length; ++i) {
            const intersection = lineLineIntersection(startPos, dirVec, this.points[i], this.dirs[i])
            if (intersection[0] <= best[0]) {
                if (best[0] <= 0.02) intersection[2] = new Position(0, 0)
                best = intersection
            }
        }
        return best
    }

    exportObstacle(row: number, col: number, i: number, ): ClientObstacle {
        return [
            row,
            col,
            i,
            this.startTime,
            this.endTime
        ]
    }
}

export function makeObstacle(mazePos: Position, index: number) {
    if (index == 0)      return makeSquare(mazePos, CONSTANTS.CELL_SIZE, CONSTANTS.CELL_SIZE)
    else if (index == 1) return makeTriangle(mazePos, CONSTANTS.CELL_SIZE, true, true)
    else if (index == 2) return makeTriangle(mazePos, CONSTANTS.CELL_SIZE, true, false)
    else if (index == 3) return makeTriangle(mazePos, CONSTANTS.CELL_SIZE, false, true)
    else if (index == 4) return makeTriangle(mazePos, CONSTANTS.CELL_SIZE, false, false)
    else if (index == 5) return makeTriangle(mazePos, CONSTANTS.MAZE_OVERLAP, true, true)
    else if (index == 6) return makeTriangle(mazePos, CONSTANTS.MAZE_OVERLAP, true, false)
    else if (index == 7) return makeTriangle(mazePos, CONSTANTS.MAZE_OVERLAP, false, true)
    else if (index == 8) return makeTriangle(mazePos, CONSTANTS.MAZE_OVERLAP, false, false)
    else throw new Error("invalid index")
}

export function makeSquare(mazePos: Position, width: number, height: number) {
    const topLeft = mazePos.scale(CONSTANTS.CELL_SIZE)
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
    const center = add(mazePos, new Position(1/2, 1/2)).scale(CONSTANTS.CELL_SIZE)
    const factor = new Position(isBottom ? +1 : -1, isRight ? +1 : -1)
    const val1 = CONSTANTS.CELL_SIZE / 2 + CONSTANTS.MAZE_OVERLAP
    const val2 = CONSTANTS.CELL_SIZE / 2 - size - CONSTANTS.MAZE_OVERLAP
    const val3 = CONSTANTS.CELL_SIZE / 2 - CONSTANTS.MAZE_OVERLAP
    const points: Position[] = [
        add(center, new Position(val1, val1).stretch(factor)),
        add(center, new Position(val1, val2).stretch(factor)),
        add(center, new Position(val3, val2).stretch(factor)),
        add(center, new Position(val2, val3).stretch(factor)),
        add(center, new Position(val2, val1).stretch(factor))
    ]
    const interiorPoints: Position[] = [
        add(center, new Position(CONSTANTS.CELL_SIZE / 2, CONSTANTS.CELL_SIZE / 2).stretch(factor)),
        add(center, new Position(CONSTANTS.CELL_SIZE / 2 - size, CONSTANTS.CELL_SIZE / 2).stretch(factor)),
        add(center, new Position(CONSTANTS.CELL_SIZE / 2, CONSTANTS.CELL_SIZE / 2 - size).stretch(factor))
    ]
    return new Obstacle(points, interiorPoints)
}
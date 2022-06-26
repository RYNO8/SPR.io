// other ideas, probably wont be used
// standard DnD algo
// http://journal.stuffwithstuff.com/2014/12/21/rooms-and-mazes/
// variation, more implement trek
// https://www.gamedeveloper.com/programming/procedural-dungeon-generation-algorithm

import * as CONSTANTS from "./../constants"
import { Player } from "./player"
import { Obstacle, ClientObstacle, makeObstacle, makeSquare } from "./obstacle"
import { Position, add, DIRECTIONS_8, sub } from "./position"

export class MazeBase {
    public obstacles: Obstacle[][][] = []

    constructor() {
        for (let row = 0; row < CONSTANTS.NUM_CELLS; ++row) {
            this.obstacles[row] = []
            for (let col = 0; col < CONSTANTS.NUM_CELLS; ++col) {
                let mazePos = new Position(col, row)
                this.obstacles[row][col] = [
                    makeObstacle(mazePos, 0),
                    makeObstacle(mazePos, 1),
                    makeObstacle(mazePos, 2),
                    makeObstacle(mazePos, 3),
                    makeObstacle(mazePos, 4),
                    makeObstacle(mazePos, 5),
                    makeObstacle(mazePos, 6),
                    makeObstacle(mazePos, 7),
                    makeObstacle(mazePos, 8)
                ]
            }
        }
    }

    // to be implemented by classes that inherit this class
    update() {

    }

    // at "pos", populate ornaments with triangles to reduce number of sharp square corners
    // erases previous ornaments
    applyMazeSmoothing() {
        for (let row = 0; row < CONSTANTS.NUM_CELLS; ++row) {
            for (let col = 0; col < CONSTANTS.NUM_CELLS; ++col) {
                let pos = new Position(col, row)
                for (let team = 0; team < CONSTANTS.NUM_TEAMS; ++team) {
                    let isThis = this.isCellBlocked(pos, team)
                    let isRight = this.isCellBlocked(add(pos, new Position(1, 0)), team)
                    let isLeft = this.isCellBlocked(add(pos, new Position(-1, 0)), team)
                    let isDown = this.isCellBlocked(add(pos, new Position(0, 1)), team)
                    let isUp = this.isCellBlocked(add(pos, new Position(0, -1)), team)

                    let numAlive: number = (isRight ? 1 : 0) + (isLeft ? 1 : 0) + (isDown ? 1 : 0) + (isUp ? 1 : 0)
                    let ok2 = numAlive === 2 && isRight !== isLeft && isDown !== isUp
                    let ok3 = numAlive >= 3

                    this.obstacles[pos.y][pos.x][1].setTo(ok2 && !isThis && isRight && isDown, team)
                    this.obstacles[pos.y][pos.x][2].setTo(ok2 && !isThis && isLeft && isDown, team)
                    this.obstacles[pos.y][pos.x][3].setTo(ok2 && !isThis && isRight && isUp, team)
                    this.obstacles[pos.y][pos.x][4].setTo(ok2 && !isThis && isLeft && isUp, team)
                    this.obstacles[pos.y][pos.x][5].setTo(ok3 && !isThis && isRight && isDown, team)
                    this.obstacles[pos.y][pos.x][6].setTo(ok3 && !isThis && isLeft && isDown, team)
                    this.obstacles[pos.y][pos.x][7].setTo(ok3 && !isThis && isRight && isUp, team)
                    this.obstacles[pos.y][pos.x][8].setTo(ok3 && !isThis && isLeft && isUp, team)
                }
            }
        }
    }

    consolePrint() {
        for (let row = 0; row < CONSTANTS.NUM_CELLS; ++row) {
            let s = ""
            for (let col = 0; col < CONSTANTS.NUM_CELLS; ++col) {
                if (this.obstacles[row][col][0].existsAfter(Date.now())) s += "#"
                else s += " "
                s += " "
            }
            console.log(s)
        }
        console.log("\n")
    }

    // determine if "mazePos" has integer coordinates within the maze bounding box
    isValidCell(mazePos: Position) {
        return (
            Number.isInteger(mazePos.x) && 0 <= mazePos.x && mazePos.x < CONSTANTS.NUM_CELLS && 
            Number.isInteger(mazePos.y) && 0 <= mazePos.y && mazePos.y < CONSTANTS.NUM_CELLS
        )
    }

    // determine if "mazePos" is outside maze bounding box (implicitly all walls)
    // or if it a explicit wall
    isCellBlocked(mazePos: Position, team?: number) {
        return (
            !this.isValidCell(mazePos) ||
            //!this.obstacles[mazePos.y][mazePos.x][0].existsBefore(Date.now())
            this.obstacles[mazePos.y][mazePos.x][0].existsAt(Date.now() + CONSTANTS.MAZE_CHANGE_DELAY + 1, team)
        )
    }


    // export array of obstacles at this "mazePos"
    getObstacles(mazePos: Position) {
        if (this.isValidCell(mazePos)) {
            return this.obstacles[mazePos.y][mazePos.x]
        } else {
            let obstacle = makeSquare(mazePos, CONSTANTS.CELL_SIZE, CONSTANTS.CELL_SIZE)
            for (let team = 0; team < CONSTANTS.NUM_TEAMS; ++team) {
                obstacle.startTime[team] = 0
                obstacle.endTime[team] = CONSTANTS.MAX_TIMESTAMP
            }
            return [obstacle]
        }
    }

    // determine whether position is blocked by an obstacle
    isPointBlocked(pos: Position, team?: number) {
        for (let dirI = 0; dirI <= 8; dirI++) {
            let obstacles = this.getObstacles(add(pos.toMazePos(), DIRECTIONS_8[dirI]))
            for (let i = 0; i < obstacles.length; ++i) {
                if (obstacles[i].existsAt(Date.now(), team) && obstacles[i].covers(pos, team)) {
                    return true
                }
            }
        }
        return false
    }

    // ray from "startPos" to "startPos + dirVec"
    // find intersections and return reflected ray
    rayTraceHelper(startPos: Position, dirVec: Position, team?: number): [number, Position, Position] {
        let best: [number, Position, Position] = [1, startPos, dirVec]
        for (let dirI = 0; dirI <= 8; dirI++) {
            let obstacles = this.getObstacles(add(startPos.toMazePos(), DIRECTIONS_8[dirI]))
            for (let i = 0; i < obstacles.length; ++i) {
                if (obstacles[i].existsAt(Date.now(), team)) {
                    let intersection = obstacles[i].rayTrace(startPos, dirVec, team)
                    if (intersection[0] <= best[0]) {
                        //if (best[0] <= 0.02) intersection[2] = new Position(0, 0)
                        best = intersection
                    }
                }
            }
        }

        return best
    }

    // ray trace to get skimming, ray trace again to ensure skimming does not collide with walls
    // NOTE: assuming skimming cannot happen more than once
    rayTrace(startPos: Position, dirVec: Position, team?: number): Position {
        let intersection = [startPos, dirVec]
        for (let rep = 0; rep < 2; ++rep) {
            let traced = this.rayTraceHelper(intersection[0], intersection[1], team)
            /*if (this.isPointBlocked(add(traced[1], traced[2]))) {
                //console.log(rep, traced[0], traced[1], add(traced[1], traced[2]), this.isPointBlocked(traced[1]))
            }*/
            intersection[0] = traced[1]
            intersection[1] = traced[2]
        }
        if (!this.isPointBlocked(add(intersection[0], intersection[1]), team)) {
            return add(intersection[0], intersection[1])
        } else if (!this.isPointBlocked(intersection[0], team)) {
            //console.log("ohno")
            return intersection[0]
        } else {
            //console.log("ohno ohno")
            return startPos
        }
    }

    // given "me", export all visible obstalces
    exportMaze(me: Player) {
        let output: ClientObstacle[] = []
        let visibleSize = new Position(
            1000000, //* CONSTANTS.VISIBLE_WIDTH / 2 + CONSTANTS.VISIBLE_BUFFER,
            1000000 //* CONSTANTS.VISIBLE_HEIGHT / 2 + CONSTANTS.VISIBLE_BUFFER
        )
        let lowerBound = sub(me.centroid, visibleSize).scale(1 / CONSTANTS.CELL_SIZE).floor()
        let upperBound = add(me.centroid, visibleSize).scale(1 / CONSTANTS.CELL_SIZE).ceil()

        for (let row = Math.max(-1, lowerBound.y); row <= Math.min(upperBound.y, CONSTANTS.NUM_CELLS); ++row) {
            for (let col = Math.max(-1, lowerBound.x); col <= Math.min(upperBound.x, CONSTANTS.NUM_CELLS); ++col) {
                let pos = new Position(col, row)
                let obstacles = this.getObstacles(pos)
                for (let i = 0; i < obstacles.length; ++i) {
                    if ((obstacles[i].existsAt(Date.now(), me.team) || obstacles[i].existsAfter(Date.now(), me.team)) && me.canSee(obstacles[i])) {
                        output.push(obstacles[i].exportObstacle(row, col, i))
                    }
                }
            }
        }
        return output
    }
}

import * as CONSTANTS from "./../constants"
import { Player } from "./player"
import { makeSquare, makeTriangle, Obstacle } from "./obstacle"
import { Position, add, DIRECTIONS_8, sub } from "./position"
import { MazeGen } from "./mazegen"
//import { MazeGenStub as MazeGen } from "./mazegen_stub"

export class Maze {
    public mazeGen: MazeGen = new MazeGen()
    public obstacles: Obstacle[][][] = []
    public todo: Position[] = []

    constructor() {
        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            this.obstacles[row] = []
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                let mazePos = new Position(row, col)
                this.obstacles[row][col] = [
                    makeSquare(mazePos, CONSTANTS.CELL_SIZE, CONSTANTS.CELL_SIZE),
                    makeTriangle(mazePos, CONSTANTS.CELL_SIZE, true, true),
                    makeTriangle(mazePos, CONSTANTS.CELL_SIZE, true, false),
                    makeTriangle(mazePos, CONSTANTS.CELL_SIZE, false, true),
                    makeTriangle(mazePos, CONSTANTS.CELL_SIZE, false, false),
                    makeTriangle(mazePos, CONSTANTS.MAZE_OVERLAP, true, true),
                    makeTriangle(mazePos, CONSTANTS.MAZE_OVERLAP, true, false),
                    makeTriangle(mazePos, CONSTANTS.MAZE_OVERLAP, false, true),
                    makeTriangle(mazePos, CONSTANTS.MAZE_OVERLAP, false, false),
                ]
            }
        }
        
        while (this.todo.length === 0) {
            this.todo.push(...this.mazeGen.findMutations())
        }
        while (this.todo.length > 0) {
            let mazePos = this.todo.shift()
            this.obstacles[mazePos.x][mazePos.y][0].add()
        }
        
        this.applyMazeSmoothing()

        this.consolePrint()
        // other ideas, probably wont be used
        // standard DnD algo
        // http://journal.stuffwithstuff.com/2014/12/21/rooms-and-mazes/
        // variation, more implement trek
        // https://www.gamedeveloper.com/programming/procedural-dungeon-generation-algorithm
    }

    consolePrint() {
        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            let s = ""
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
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
    isCellBlocked(mazePos: Position) {
        return (
            !this.isValidCell(mazePos) ||
            //!this.obstacles[mazePos.x][mazePos.y][0].existsBefore(Date.now())
            this.obstacles[mazePos.x][mazePos.y][0].existsAt(Date.now() + CONSTANTS.MAZE_CHANGE_DELAY + 1)
        )
    }

    // at "pos", populate ornaments with triangles to reduce number of sharp square corners
    // erases previous ornaments
    applyMazeSmoothing() {
        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                let pos = new Position(row, col)
                let isThis = this.isCellBlocked(pos)
                let isRight = this.isCellBlocked(add(pos, new Position(1, 0)))
                let isLeft = this.isCellBlocked(add(pos, new Position(-1, 0)))
                let isBottom = this.isCellBlocked(add(pos, new Position(0, 1)))
                let isTop = this.isCellBlocked(add(pos, new Position(0, -1)))
                let numAlive: number = (isRight ? 1 : 0) + (isLeft ? 1 : 0) + (isBottom ? 1 : 0) + (isTop ? 1 : 0)

                let ok2 = numAlive === 2 && isRight !== isLeft && isBottom !== isTop
                let ok3 = numAlive >= 3
                this.obstacles[pos.x][pos.y][1].setTo(ok2 && !isThis && isRight && isBottom)
                this.obstacles[pos.x][pos.y][2].setTo(ok2 && !isThis && isRight && isTop)
                this.obstacles[pos.x][pos.y][3].setTo(ok2 && !isThis && isLeft && isBottom)
                this.obstacles[pos.x][pos.y][4].setTo(ok2 && !isThis && isLeft && isTop)
                this.obstacles[pos.x][pos.y][5].setTo(ok3 && !isThis && isRight && isBottom)
                this.obstacles[pos.x][pos.y][6].setTo(ok3 && !isThis && isRight && isTop)
                this.obstacles[pos.x][pos.y][7].setTo(ok3 && !isThis && isLeft && isBottom)
                this.obstacles[pos.x][pos.y][8].setTo(ok3 && !isThis && isLeft && isTop)
            }
        }
    }

    // find new maze state if current state is complete
    // apply a random change to maze that transitions it towards new maze state
    // apply maze smoothing (optimised)
    update() {
        while (this.todo.length === 0) {
            this.todo.push(...this.mazeGen.findMutations())
        }

        let mazePos = this.todo.shift()
        this.obstacles[mazePos.x][mazePos.y][0].setTo(this.obstacles[mazePos.x][mazePos.y][0].existsBefore(Date.now()))
        this.applyMazeSmoothing()
    }

    

    // export array of obstacles at this "mazePos"
    getObstacles(mazePos: Position) {
        if (this.isValidCell(mazePos)) {
            return this.obstacles[mazePos.x][mazePos.y]
        } else {
            let obstacle = makeSquare(mazePos, CONSTANTS.CELL_SIZE, CONSTANTS.CELL_SIZE)
            obstacle.startTime = 0
            obstacle.endTime = CONSTANTS.MAX_TIMESTAMP
            return [obstacle]
        }
    }

    // determine whether position is blocked by an obstacle
    isPointBlocked(pos: Position) {
        for (let dirI = 0; dirI <= 8; dirI++) {
            let obstacles = this.getObstacles(add(pos, DIRECTIONS_8[dirI]).toMazePos())
            for (let i = 0; i < obstacles.length; i++) {
                if (obstacles[i].existsAt(Date.now()) && obstacles[i].covers(pos)) {
                    return true
                }
            }
        }
        return false
    }

    // ray from "startPos" to "startPos + dirVec"
    // find intersections and return reflected ray
    rayTraceHelper(startPos: Position, dirVec: Position): [number, Position, Position] {
        let best: [number, Position, Position] = [1, startPos, dirVec]
        for (let dirI = 0; dirI <= 8; dirI++) {
            let obstacles = this.getObstacles(add(startPos.toMazePos(), DIRECTIONS_8[dirI]))
            for (let i = 0; i < obstacles.length; i++) {
                if (obstacles[i].existsAt(Date.now())) {
                    let intersection = obstacles[i].rayTrace(startPos, dirVec)
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
    rayTrace(startPos: Position, dirVec: Position): Position {
        let intersection = [startPos, dirVec]
        for (let rep = 0; rep < 2; ++rep) {
            let traced = this.rayTraceHelper(intersection[0], intersection[1])
            if (this.isPointBlocked(add(traced[1], traced[2]))) {
                //console.log(rep, traced[0], traced[1], add(traced[1], traced[2]), this.isPointBlocked(traced[1]))
            }
            intersection[0] = traced[1]
            intersection[1] = traced[2]
        }
        if (!this.isPointBlocked(add(intersection[0], intersection[1]))) {
            return add(intersection[0], intersection[1])
        } else if (!this.isPointBlocked(intersection[0])) {
            //console.log("ohno")
            return intersection[0]
        } else {
            //console.log("ohno ohno")
            return startPos
        }
    }

    // given "me", export all visible obstalces
    exportMaze(me: Player) {
        let output: Obstacle[] = []
        let visibleSize = new Position(
            CONSTANTS.VISIBLE_WIDTH / 2 + CONSTANTS.VISIBLE_BUFFER,
            CONSTANTS.VISIBLE_HEIGHT / 2 + CONSTANTS.VISIBLE_BUFFER
        )
        let lowerBound = sub(me.centroid, visibleSize).scale(1 / CONSTANTS.CELL_SIZE).floor()
        let upperBound = add(me.centroid, visibleSize).scale(1 / CONSTANTS.CELL_SIZE).ceil()
        

        for (let row = Math.max(-1, lowerBound.x); row <= upperBound.x && row < CONSTANTS.NUM_CELLS + 1; row++) {
            for (let col = Math.max(-1, lowerBound.y); col <= upperBound.y && col < CONSTANTS.NUM_CELLS + 1; col++) {
                let obstacles = this.getObstacles(new Position(row, col))
                for (let i = 0; i < obstacles.length; i++) {
                    if ((obstacles[i].existsAt(Date.now()) || obstacles[i].existsAfter(Date.now())) && me.canSee(obstacles[i])) {
                        output.push(obstacles[i].exportObstacle())
                    }
                }
            }
        }
        return output
    }
}
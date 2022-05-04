import * as CONSTANTS from "./../constants"
import { Player } from "./player"
import { makeSquareObstacle, Obstacle } from "./obstacle"
import { Position, add, DIRECTIONS_4 } from "./position"

function randDirection() {
    let i = Math.floor(Math.random() * 4)
    let dRow: number = <any>(i == 0) - <any>(i == 1)
    let dCol: number = <any>(i == 2) - <any>(i == 3)
    return [dRow, dCol]
}

export class Maze {
    public maze: Obstacle[][][] = []

    constructor() {
        this.randMazeGen()

        // TODO
        /*for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            this.maze[row] = []
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                this.maze[row][col] = false
            }
        }
        this.dfsMazeGen(0, 0)*/

        /*for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            this.maze[row] = []
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                this.maze[row][col] = true
            }
        }
        this.randwalkMazeGen()*/

        /*for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            this.maze[row] = []
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                this.maze[row][col] = true
            }
        }
        this.drunkardwalkMazeGen()*/

        //this.cellAutomataMazeGen()

        // https://en.wikipedia.org/wiki/Gabriel_graph
        // https://en.wikipedia.org/wiki/Relative_neighborhood_graph

        // standard DnD algo
        // http://journal.stuffwithstuff.com/2014/12/21/rooms-and-mazes/
        // variation, more implement trek
        // https://www.gamedeveloper.com/programming/procedural-dungeon-generation-algorithm
    }

    randMazeGen() {
        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            this.maze[row] = []
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                if (Math.random() <= CONSTANTS.MAZE_DENSITY) {
                //if (row == 2 && col == 2) {
                    this.maze[row][col] = [makeSquareObstacle(new Position(row, col).scale(CONSTANTS.CELL_SIZE), CONSTANTS.CELL_SIZE, CONSTANTS.CELL_SIZE)]
                } else {
                    this.maze[row][col] = []
                }
            }
        }
    }

    /*dfsMazeGen(row: number, col: number) {
        this.maze[row][col] = false

        for (let rep = 0; rep < 10; rep++) {
            let [dRow, dCol] = randDirection()
            if (0 <= row + 2 * dRow && row + 2 * dRow < CONSTANTS.NUM_CELLS && 0 <= col + 2 * dCol && col + 2 * dCol <= CONSTANTS.NUM_CELLS && this.maze[row + 2 * dRow][col + 2 * dCol]) {
                this.maze[row + dRow][col + dCol] = false
                this.dfsMazeGen(row + 2 * dRow, col + 2 * dCol)
            }
        }
    }

    randwalkMazeGen() {
        // these constants are specific to CONSTANTS.NUM_CELLS == 20
        // TODO: test if these constants scale linearly with NUM_CELLS
        // tested using https://cdpn.io/abdolsa/fullembedgrid/zEKdop?animations=run&type=embed
        let NUM_TUNNELS = 140
        let MAX_LENGTH = 7

        let mazeX = Math.floor(CONSTANTS.NUM_CELLS / 2)
        let mazeY = Math.floor(CONSTANTS.NUM_CELLS / 2)
        let dx = 1
        let dy = 0
        for (let rep = 0; rep < NUM_TUNNELS; rep++) {
            if (Math.random() < 0.5) {
                [dx, dy] = [-dy, dx]
            } else {
                [dx, dy] = [dy, -dx]
            }

            let length = Math.floor(Math.random() * MAX_LENGTH)
            for (let i = 0; i < length && this.isValidCell(mazeX + dx, mazeY + dy); i++) {
                this.maze[mazeX][mazeY] = false
                mazeX += dx
                mazeY += dy
            }
            this.maze[mazeX][mazeY] = false
        }
    }

    drunkardwalkMazeGen() {
        let NUM_STEPS = CONSTANTS.NUM_CELLS * CONSTANTS.NUM_CELLS

        let mazeX = Math.floor(CONSTANTS.NUM_CELLS / 2)
        let mazeY = Math.floor(CONSTANTS.NUM_CELLS / 2)
        let seen: [number, number][] = []
        for (let rep = 0; rep < NUM_STEPS; rep++) {
            let [dx, dy] = randDirection()
            if (this.isValidCell(mazeX + dx, mazeY + dy) && this.maze[mazeX + dx][mazeY + dy]) {
                mazeX += dx
                mazeY += dy
                this.maze[mazeX][mazeY] = false
                seen.push([mazeX, mazeY])
            } else {
                [mazeX, mazeY] = seen[Math.floor(Math.random() * seen.length)]
            }
        }
    }

    aliveNeighbours(mazeX: number, mazeY: number) {
        let total = 0
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx != 0 || dy != 0) {
                    total += <any>(this.getCell(mazeX + dx, mazeY + dy))
                }
            }
        }
        return total
    }
    cellAutomataMazeGen() {
        // https://gamedevelopment.tutsplus.com/tutorials/generate-random-cave-levels-using-cellular-automata--gamedev-9664
        let INITIAL_CHANCE = 0.45
        let NUM_STEPS = 5
        let DEATH_LIMIT = 2
        let BIRTH_LIMIT = 4

        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            this.maze[row] = []
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                this.maze[row][col] = Math.random() <= INITIAL_CHANCE
            }
        }

        
        for (let rep = 0; rep < NUM_STEPS; rep++) {
            let newMaze: boolean[][] = []
            for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
                newMaze[row] = []
                for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                    if (this.maze[row][col]) {
                        newMaze[row][col] = this.aliveNeighbours(row, col) <= DEATH_LIMIT
                    } else {
                        newMaze[row][col] = this.aliveNeighbours(row, col) <= BIRTH_LIMIT
                    }
                }
            }
            this.maze = newMaze
        }
    }*/

    isValidCell(mazePos: Position) {
        return (
            Number.isInteger(mazePos.x) && 0 <= mazePos.x && mazePos.x < CONSTANTS.NUM_CELLS && 
            Number.isInteger(mazePos.y) && 0 <= mazePos.y && mazePos.y < CONSTANTS.NUM_CELLS
        )
    }

    getCell(mazePos: Position) {
        if (this.isValidCell(mazePos)) {
            return this.maze[mazePos.x][mazePos.y]
        } else {
            return []
        }
    }

    isPointBlocked(pos: Position) {
        let mazePos = pos.scale(1 / CONSTANTS.CELL_SIZE).floor()
        let obstacles = this.getCell(mazePos)
        for (let i = 0; i < obstacles.length; i++) {
            if (obstacles[i].covers(pos)) {
                return true
            }
        }
        return false
    }

    rayTrace(startPos: Position, dirVec: Position): [number, Position] {
        let best: [number, Position, Position] = [1, startPos, dirVec]

        let mazePos = startPos.scale(1 / CONSTANTS.CELL_SIZE).floor()
        for (let rep = 0; rep < 2; rep++) {
            best[0] = 1
            let oldBest: [number, Position, Position] = best
            for (let i = 0; i < 4; i++) {
                let obstacles = this.getCell(add(mazePos, DIRECTIONS_4[i]))
                for (let i = 0; i < obstacles.length; i++) {
                    let intersection = obstacles[i].rayTrace(oldBest[1], oldBest[2])
                    if (intersection[0] < best[0]) {
                        best = intersection
                    }
                }
            }
        }

        return [best[0], add(best[1], best[2])]
    }

    exportMaze(me: Player) {
        let output: Obstacle[] = []
        // TODO: dont look through everything
        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                for (let i = 0; i < this.maze[row][col].length; i++) {
                    if (this.maze[row][col][i].isVisible(me)) {
                        output.push(this.maze[row][col][i].exportObstacle())
                    }
                }
            }
        }
        return output
    }
}
import * as CONSTANTS from "./../constants"
import { Player } from "./player"
import { makeSquareObstacle, makeTriangleObstacle, Obstacle } from "./obstacle"
import { Position, add, DIRECTIONS_4, DIRECTIONS_8, findAvg, isEqual } from "./position"
import { randChoice, randRange } from "../utilities"

export class Maze {
    public maze: Obstacle[][][] = []

    constructor() {
        //this.basicMazeGen()
        //this.randMazeGen()

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

        this.cellAutomataMazeGen()

        // https://en.wikipedia.org/wiki/Gabriel_graph
        // https://en.wikipedia.org/wiki/Relative_neighborhood_graph

        // standard DnD algo
        // http://journal.stuffwithstuff.com/2014/12/21/rooms-and-mazes/
        // variation, more implement trek
        // https://www.gamedeveloper.com/programming/procedural-dungeon-generation-algorithm
    }

    basicMazeGen() {
        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            this.maze[row] = []
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                if (row == 2 && col == 2) {
                    //this.maze[row][col] = [makeSquareObstacle(new Position(row, col).scale(CONSTANTS.CELL_SIZE), CONSTANTS.CELL_SIZE, CONSTANTS.CELL_SIZE)]
                    this.maze[row][col] = [makeTriangleObstacle(new Position(row, col).scale(CONSTANTS.CELL_SIZE), CONSTANTS.CELL_SIZE, CONSTANTS.CELL_SIZE, false, false)]
                } else {
                    this.maze[row][col] = []
                }
            }
        }
    }

    randMazeGen() {
        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            this.maze[row] = []
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                if (Math.random() <= CONSTANTS.MAZE_DENSITY) {
                    if (Math.random() <= 0.5) {
                        this.maze[row][col] = [makeSquareObstacle(new Position(row, col).scale(CONSTANTS.CELL_SIZE), CONSTANTS.CELL_SIZE, CONSTANTS.CELL_SIZE)]
                    } else {
                        this.maze[row][col] = [makeTriangleObstacle(new Position(row, col).scale(CONSTANTS.CELL_SIZE), CONSTANTS.CELL_SIZE, CONSTANTS.CELL_SIZE, false, false)]
                    }
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
    }*/

    getComponent(pos: Position, seen: boolean[][]) {
        let allPos: Position[] = []
        let queue: Position[] = []
        queue.push(pos)

        while (queue.length > 0) {
            let curr = queue[0]
            allPos.push(curr)
            queue.shift()

            for (let i = 0; i < 4; i++) {
                let neighbour = add(curr, DIRECTIONS_4[i])
                if (!this.isCellBlocked(neighbour) && !seen[neighbour.x][neighbour.y]) {
                    seen[neighbour.x][neighbour.y] = true
                    queue.push(neighbour)
                }
            }
        }
        return allPos
    }

    digTunnel(start: Position, end: Position) {
        this.maze[start.x][start.y] = []
        while (!isEqual(start, end)) {
            if (start.x > end.x && Math.random() < 0.5) start.x--
            else if (start.y > end.y && Math.random() < 0.5) start.y--
            else if (start.x < end.x && Math.random() < 0.5) start.x++
            else if (start.y < end.y && Math.random() < 0.5) start.y++
            this.maze[start.x][start.y] = []
        }
    }

    joinComponents() {
        let seen: boolean[][] = []
        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            seen[row] = []
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                seen[row][col] = false
            }
        }

        let allCentroids: Position[] = []
        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                let pos = new Position(row, col)
                if (this.isCellBlocked(pos) || seen[pos.x][pos.y]) continue

                let allPos = this.getComponent(pos, seen)
                let centroid = findAvg(allPos).floor()
                allCentroids.push(centroid)
            }
        }

        /*for (let i = 0; i < allCentroids.length; i++) {
            // NOTE: this does not ensure all components are connected
            // it may even connect a component to itself
            // hopefully larger components grow bigger, since there is a larger chance it is cut by a tunnel
            this.digTunnel(allCentroids[i], randChoice(allCentroids))
        }*/

        console.log(allCentroids)

        let parents: number[] = []
        for (let i = 0; i < allCentroids.length; i++) parents[i] = i
        function getParent(node: number) {
            if (parents[node] != node) parents[node] = getParent(parents[node])
            return parents[node]
        }

        for (let numEdges = 0; numEdges < allCentroids.length - 1; ) {
            let i = randRange(0, allCentroids.length - 1)
            let j = randRange(0, allCentroids.length - 1)
            if (getParent(i) != getParent(j)) {
                parents[getParent(i)] = getParent(j)
                this.digTunnel(allCentroids[i], allCentroids[j])
                numEdges++
            }
        }
    }
    

    applyMazeSmoothing() {
        let newMaze: Obstacle[][][] = []
        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            newMaze[row] = []
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                let pos = new Position(row, col)
                let numAlive = 0
                for (let i = 0; i < 4; i++) {
                    if (this.isCellBlocked(add(pos, DIRECTIONS_4[i]))) {
                        numAlive++
                    }
                }
                
                if (numAlive == 2 && 
                    !this.isCellBlocked(pos) &&
                    this.isCellBlocked(add(pos, new Position(1, 0))) != this.isCellBlocked(add(pos, new Position(-1, 0))) &&
                    this.isCellBlocked(add(pos, new Position(0, 1))) != this.isCellBlocked(add(pos, new Position(0, -1)))
                ) {
                    let isRight = this.isCellBlocked(add(pos, new Position(1, 0)))
                    let isBottom = this.isCellBlocked(add(pos, new Position(0, 1)))
                    newMaze[row][col] = [makeTriangleObstacle(pos.scale(CONSTANTS.CELL_SIZE), CONSTANTS.CELL_SIZE, CONSTANTS.CELL_SIZE, isRight, isBottom)]
                } else {
                    newMaze[row][col] = this.maze[row][col]
                }
            }
        }
        this.maze = newMaze
    }

    cellAutomataStep() {
        let DEATH_LIMIT = 2
        let BIRTH_LIMIT = 4

        let newMaze: Obstacle[][][] = []
        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            newMaze[row] = []
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                let pos = new Position(row, col)
                let numAlive = 0
                for (let i = 0; i < 8; i++) {
                    if (this.isValidCell(add(pos, DIRECTIONS_8[i])) && this.isCellBlocked(add(pos, DIRECTIONS_8[i]))) {
                        numAlive++
                    }
                }

                if (this.isCellBlocked(pos)) {
                    if (numAlive <= DEATH_LIMIT) {
                        newMaze[row][col] = [makeSquareObstacle(pos.scale(CONSTANTS.CELL_SIZE), CONSTANTS.CELL_SIZE, CONSTANTS.CELL_SIZE)]
                    } else {
                        newMaze[row][col] = []
                    }
                } else {
                    if (numAlive <= BIRTH_LIMIT) {
                        newMaze[row][col] = [makeSquareObstacle(pos.scale(CONSTANTS.CELL_SIZE), CONSTANTS.CELL_SIZE, CONSTANTS.CELL_SIZE)]
                    } else {
                        newMaze[row][col] = []
                    }
                }
            }
        }
        this.maze = newMaze
    }

    cellAutomataMazeGen() {
        // https://gamedevelopment.tutsplus.com/tutorials/generate-random-cave-levels-using-cellular-automata--gamedev-9664
        let INITIAL_CHANCE = 0.45
        let NUM_STEPS = 3

        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            this.maze[row] = []
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                if (Math.random() <= INITIAL_CHANCE) {
                    this.maze[row][col] = [makeSquareObstacle(new Position(row, col).scale(CONSTANTS.CELL_SIZE), CONSTANTS.CELL_SIZE, CONSTANTS.CELL_SIZE)]
                } else {
                    this.maze[row][col] = []
                }
            }
        }

        for (let rep = 0; rep < NUM_STEPS; rep++) this.cellAutomataStep()
        this.joinComponents()
        //this.cellAutomataStep()
        this.applyMazeSmoothing()
    }

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
            return [makeSquareObstacle(mazePos.scale(CONSTANTS.CELL_SIZE), CONSTANTS.CELL_SIZE, CONSTANTS.CELL_SIZE)]
        }
    }

    isCellBlocked(mazePos: Position) {
        return !this.isValidCell(mazePos) || this.maze[mazePos.x][mazePos.y].length > 0
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
            for (let i = 0; i < 5; i++) {
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
        let rowLeft = 0
        let rowRight = CONSTANTS.NUM_CELLS - 1
        let colLeft = 0
        let colRight = CONSTANTS.NUM_CELLS - 1

        if (me) {
            rowLeft = Math.max(rowLeft, Math.floor((me.centroid.x - CONSTANTS.VISIBLE_WIDTH / 2 - CONSTANTS.VISIBLE_BUFFER) / CONSTANTS.CELL_SIZE))
            rowRight = Math.min(rowRight, Math.ceil((me.centroid.x + CONSTANTS.VISIBLE_WIDTH / 2 + CONSTANTS.VISIBLE_BUFFER) / CONSTANTS.CELL_SIZE))
            colLeft = Math.max(colLeft, Math.floor((me.centroid.y - CONSTANTS.VISIBLE_HEIGHT / 2 - CONSTANTS.VISIBLE_BUFFER) / CONSTANTS.CELL_SIZE))
            colRight = Math.min(colRight, Math.ceil((me.centroid.y + CONSTANTS.VISIBLE_WIDTH / 2 + CONSTANTS.VISIBLE_BUFFER) / CONSTANTS.CELL_SIZE))
        }

        for (let row = rowLeft; row <= rowRight; row++) {
            for (let col = colLeft; col <= colRight; col++) {
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
import * as CONSTANTS from "./../constants"
import { Player } from "./player"
import { makeSquareObstacle, makeTriangleObstacle, Obstacle } from "./obstacle"
import { Position, add, DIRECTIONS_4, DIRECTIONS_8, findAvg, isEqual } from "./position"
import { randChoice, randRange } from "../utilities"

export class Maze {
    public maze: boolean[][] = []
    public ornaments: Obstacle[][][] = []

    constructor() {
        this.clearMaze()
        this.clearOrnaments()

        //this.basicMazeGen()
        //this.randMazeGen()
        this.cellAutomataMazeGen()

        // https://en.wikipedia.org/wiki/Gabriel_graph
        // https://en.wikipedia.org/wiki/Relative_neighborhood_graph

        // standard DnD algo
        // http://journal.stuffwithstuff.com/2014/12/21/rooms-and-mazes/
        // variation, more implement trek
        // https://www.gamedeveloper.com/programming/procedural-dungeon-generation-algorithm
    }

    clearMaze() {
        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            this.maze[row] = []
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                this.maze[row][col] = false
            }
        }
    }

    clearOrnaments() {
        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            this.ornaments[row] = []
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                this.ornaments[row][col] = []
            }
        }
    }

    basicMazeGen() {
        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                if (row == 2 && col == 2) {
                    //this.maze[row][col] = true
                    this.ornaments[row][col] = [makeTriangleObstacle(new Position(row, col).scale(CONSTANTS.CELL_SIZE), CONSTANTS.CELL_SIZE, CONSTANTS.CELL_SIZE, false, false)]
                }
            }
        }
    }

    randMazeGen() {
        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                if (Math.random() <= CONSTANTS.MAZE_DENSITY) {
                    if (Math.random() <= 0.5) {
                        this.maze[row][col] = true
                    } else {
                        this.ornaments[row][col] = [makeTriangleObstacle(new Position(row, col).scale(CONSTANTS.CELL_SIZE), CONSTANTS.CELL_SIZE, CONSTANTS.CELL_SIZE, false, false)]
                    }
                }
            }
        }
    }

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
        this.maze[start.x][start.y] = false
        while (!isEqual(start, end)) {
            if (start.x > end.x && Math.random() < 0.5) start.x--
            else if (start.y > end.y && Math.random() < 0.5) start.y--
            else if (start.x < end.x && Math.random() < 0.5) start.x++
            else if (start.y < end.y && Math.random() < 0.5) start.y++
            this.maze[start.x][start.y] = false
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

        let parents: number[] = []
        for (let i = 0; i < allCentroids.length; i++) parents[i] = i
        function getParent(node: number) {
            if (parents[node] != node) {
                parents[node] = getParent(parents[node])
            }
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
        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
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
                    this.ornaments[row][col] = [makeTriangleObstacle(pos.scale(CONSTANTS.CELL_SIZE), CONSTANTS.CELL_SIZE, CONSTANTS.CELL_SIZE, isRight, isBottom)]
                }
            }
        }
    }

    cellAutomataStep() {
        let DEATH_LIMIT = 2
        let BIRTH_LIMIT = 4

        let newMaze: boolean[][] = []
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
                    newMaze[row][col] = numAlive <= DEATH_LIMIT
                } else {
                    newMaze[row][col] = numAlive <= BIRTH_LIMIT
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
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                this.maze[row][col] = Math.random() <= INITIAL_CHANCE
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

    isCellBlocked(mazePos: Position) {
        return !this.isValidCell(mazePos) || this.maze[mazePos.x][mazePos.y]
    }

    getObstacles(mazePos: Position) {
        let obstacles: Obstacle[] = []
        if (this.isCellBlocked(mazePos)) {
            obstacles.push(makeSquareObstacle(mazePos.scale(CONSTANTS.CELL_SIZE), CONSTANTS.CELL_SIZE, CONSTANTS.CELL_SIZE))
        }
        if (this.isValidCell(mazePos)) {
            obstacles = obstacles.concat(this.ornaments[mazePos.x][mazePos.y])
        }
        return obstacles
    }

    isPointBlocked(pos: Position) {
        let mazePos = pos.scale(1 / CONSTANTS.CELL_SIZE).floor()
        let obstacles = this.getObstacles(mazePos)
        for (let i = 0; i < obstacles.length; i++) {
            if (obstacles[i].covers(pos)) {
                return true
            }
        }
        return false
    }

    rayTraceHelper(startPos: Position, dirVec: Position): [number, Position, Position] {
        let best: [number, Position, Position] = [1, startPos, dirVec]

        let mazePos = startPos.scale(1 / CONSTANTS.CELL_SIZE).floor()
        for (let i = 0; i <= 8; i++) {
            let obstacles = this.getObstacles(add(mazePos, DIRECTIONS_8[i]))
            for (let i = 0; i < obstacles.length; i++) {
                let intersection = obstacles[i].rayTrace(startPos, dirVec)
                if (intersection[0] < best[0]) {
                    best = intersection
                }
            }
        }

        return best
    }

    rayTrace(startPos: Position, dirVec: Position): [number, Position] {
        let intersection1 = this.rayTraceHelper(startPos, dirVec)
        let intersection2 = this.rayTraceHelper(intersection1[1], intersection1[2])
        return [intersection1[0], add(intersection2[1], intersection2[2])]
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
                let obstacles = this.getObstacles(new Position(row, col))
                for (let i = 0; i < obstacles.length; i++) {
                    if (obstacles[i].isVisible(me)) {
                        output.push(obstacles[i].exportObstacle())
                    }
                }
            }
        }
        return output
    }
}
import * as CONSTANTS from "./../constants"
import { Player } from "./player"
import { makeSquareObstacle, makeTriangleObstacle, Obstacle } from "./obstacle"
import { Position, add, DIRECTIONS_4, DIRECTIONS_8, findAvg, isEqual, sub } from "./position"
import { randChance, randRange, randShuffle } from "../utilities"

export class Maze {
    public maze: boolean[][] = []
    public mazeTime: number[][] = []
    public noise: boolean[][] = []
    public ornaments: Obstacle[][][] = []
    public todo: Position[] = []

    constructor() {
        this.clearMaze()
        this.clearOrnaments()

        //this.basicMazeGen()
        this.randNoiseGen()
        this.cellAutomataMazeGen()
        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                let pos = new Position(row, col)
                this.applyMazeSmoothing(pos)
            }
        }

        // other ideas, probably wont be used
        // standard DnD algo
        // http://journal.stuffwithstuff.com/2014/12/21/rooms-and-mazes/
        // variation, more implement trek
        // https://www.gamedeveloper.com/programming/procedural-dungeon-generation-algorithm
    }

    clearMaze() {
        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            this.maze[row] = []
            this.mazeTime[row] = []
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                this.maze[row][col] = false
                this.mazeTime[row][col] = 0
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
                    this.ornaments[row][col] = [makeTriangleObstacle(Date.now(), new Position(row, col).scale(CONSTANTS.CELL_SIZE), CONSTANTS.CELL_SIZE, CONSTANTS.CELL_SIZE, false, false)]
                }
            }
        }
    }

    randNoiseGen() {
        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            this.noise[row] = []
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                this.noise[row][col] = randChance(CONSTANTS.MAZE_DENSITY)
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
            let dx = Math.abs(end.x - start.x)
            let dy = Math.abs(end.y - start.y)
            if (randChance(dx / (dx + dy))) {
                if (start.x > end.x) start.x--
                else if (start.x < end.x) start.x++
            } else {
                if (start.y > end.y) start.y--
                else if (start.y < end.y) start.y++
            }
            this.maze[start.x][start.y] = false
        }
    }

    getAllCentroids() {
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
                if (!this.isCellBlocked(pos) && !seen[pos.x][pos.y]) {
                    let allPos = this.getComponent(pos, seen)
                    let centroid = findAvg(allPos).floor()
                    allCentroids.push(centroid)
                }
            }
        }
        return allCentroids
    }

    joinComponentsRandom(allCentroids: Position[]) {
        let parents: number[] = []
        for (let i = 0; i < allCentroids.length; i++) parents[i] = i
        function getParent(node: number) {
            if (parents[node] != node) {
                parents[node] = getParent(parents[node])
            }
            return parents[node]
        }

        // random subtree
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

    joinComponentsKruskals(allCentroids: Position[]) {
        let parents: number[] = []
        for (let i = 0; i < allCentroids.length; i++) parents[i] = i
        function getParent(node: number) {
            if (parents[node] != node) {
                parents[node] = getParent(parents[node])
            }
            return parents[node]
        }

        // krushals mst
        let allEdges: [number, number, number][] = []
        for (let i = 0; i < allCentroids.length; i++) {
            for (let j = 0; j < i; j++) {
                allEdges.push([sub(allCentroids[i], allCentroids[j]).manhattanDist(), i, j])
            }
        }
        allEdges.sort(function(a: [number, number, number], b: [number, number, number]) {
            return a[0] - b[0]
        })
        for (let i = 0; i < allEdges.length; i++) {
            let a = allEdges[i][1]
            let b = allEdges[i][2]
            if (getParent(a) != getParent(b)) {
                parents[getParent(a)] = getParent(b)
                this.digTunnel(allCentroids[a], allCentroids[b])
            }
        }
    }

    joinComponentsGabriel(allCentroids: Position[]) {
        // https://en.wikipedia.org/wiki/Gabriel_graph
        for (let i = 0; i < allCentroids.length; i++) {
            for (let j = 0; j < i; j++) {
                let mid = findAvg([allCentroids[i], allCentroids[j]])
                let smallestDist = Math.min(
                    sub(allCentroids[i], mid).quadrance(), 
                    sub(allCentroids[j], mid).quadrance()
                )
                let good = true
                for (let k = 0; k < allCentroids.length && good; k++) {
                    if (sub(allCentroids[k], mid).quadrance() < smallestDist) {
                        good = false
                    }
                }

                if (good) {
                    this.digTunnel(allCentroids[i], allCentroids[j])
                }
            }
        }
    }

    joinComponentsRNG(allCentroids: Position[]) {
        // https://en.wikipedia.org/wiki/Relative_neighborhood_graph
        for (let i = 0; i < allCentroids.length; i++) {
            for (let j = 0; j < i; j++) {
                let smallestDist = sub(allCentroids[i], allCentroids[j]).quadrance()
                let good = true
                for (let k = 0; k < allCentroids.length && good; k++) {
                    if (sub(allCentroids[k], allCentroids[i]).quadrance() < smallestDist) {
                        good = false
                    } else if (sub(allCentroids[k], allCentroids[j]).quadrance() < smallestDist) {
                        good = false
                    }
                }

                if (good) {
                    this.digTunnel(allCentroids[i], allCentroids[j])
                }
            }
        }
    }
    

    applyMazeSmoothing(pos: Position) {
        if (!this.isValidCell(pos)) return

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
            this.ornaments[pos.x][pos.y] = [makeTriangleObstacle(
                Date.now() + CONSTANTS.MAZE_CHANGE_DELAY,
                pos.scale(CONSTANTS.CELL_SIZE),
                CONSTANTS.CELL_SIZE,
                CONSTANTS.CELL_SIZE,
                isRight,
                isBottom
            )]
        } else {
            this.ornaments[pos.x][pos.y] = []
        }
    }

    cellAutomataStep() {
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
                    newMaze[row][col] = numAlive <= CONSTANTS.CA_DEATH_LIMIT
                } else {
                    newMaze[row][col] = numAlive <= CONSTANTS.CA_BIRTH_LIMIT
                }
            }
        }
        this.maze = newMaze
    }

    cellAutomataMazeGen() {
        // https://gamedevelopment.tutsplus.com/tutorials/generate-random-cave-levels-using-cellular-automata--gamedev-9664
        this.maze = this.noise

        for (let rep = 0; rep < CONSTANTS.CA_NUM_STEPS; rep++) this.cellAutomataStep()
        this.joinComponentsGabriel(this.getAllCentroids())
    }

    update() {
        while (this.todo.length == 0) {
            let pos: Position = new Position(0, 0)
            do {
                pos.x = randRange(0, CONSTANTS.NUM_CELLS - 1)
                pos.y = randRange(0, CONSTANTS.NUM_CELLS - 1)
            } while (this.noise[pos.x][pos.y] == randChance(CONSTANTS.MAZE_DENSITY))
            this.noise[pos.x][pos.y] = !this.noise[pos.x][pos.y]
            let oldMaze = this.maze
            this.cellAutomataMazeGen()
            for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
                for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                    if (oldMaze[row][col] != this.maze[row][col]) {
                        this.todo.push(new Position(row, col))
                    }
                }
            }
            randShuffle(this.todo)
            this.maze = oldMaze
        }

        let mazePos = this.todo.shift()
        this.maze[mazePos.x][mazePos.y] = !this.maze[mazePos.x][mazePos.y]
        this.mazeTime[mazePos.x][mazePos.y] = Date.now() + CONSTANTS.MAZE_CHANGE_DELAY
        for (let i = 0; i <= 8; ++i) {
            this.applyMazeSmoothing(add(mazePos, DIRECTIONS_8[i]))
        }
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
            let time = this.isValidCell(mazePos) ? this.mazeTime[mazePos.x][mazePos.y] : 0
            obstacles.push(makeSquareObstacle(time, mazePos.scale(CONSTANTS.CELL_SIZE), CONSTANTS.CELL_SIZE, CONSTANTS.CELL_SIZE))
        }
        if (this.isValidCell(mazePos)) {
            obstacles = obstacles.concat(this.ornaments[mazePos.x][mazePos.y])
        }
        return obstacles
    }

    isPointBlocked(pos: Position) {
        let obstacles = this.getObstacles(pos.toMazePos())
        for (let i = 0; i < obstacles.length; i++) {
            if (obstacles[i].covers(pos)) {
                return true
            }
        }
        return false
    }

    rayTraceHelper(startPos: Position, dirVec: Position): [number, Position, Position] {
        let best: [number, Position, Position] = [1, startPos, dirVec]
        for (let i = 0; i <= 8; i++) {
            let obstacles = this.getObstacles(add(startPos.toMazePos(), DIRECTIONS_8[i]))
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
        let visibleSize = new Position(
            CONSTANTS.VISIBLE_WIDTH / 2 + CONSTANTS.VISIBLE_BUFFER,
            CONSTANTS.VISIBLE_HEIGHT / 2 + CONSTANTS.VISIBLE_BUFFER
        )
        let lowerBound = sub(me.centroid, visibleSize).scale(1 / CONSTANTS.CELL_SIZE).floor()
        let upperBound = add(me.centroid, visibleSize).scale(1 / CONSTANTS.CELL_SIZE).ceil()
        

        for (let row = Math.max(0, lowerBound.x); row <= upperBound.x && row < CONSTANTS.NUM_CELLS; row++) {
            for (let col = Math.max(0, lowerBound.y); col <= upperBound.y && col < CONSTANTS.NUM_CELLS; col++) {
                let obstacles = this.getObstacles(new Position(row, col))
                for (let i = 0; i < obstacles.length; i++) {
                    if (me.canSee(obstacles[i])) {
                        output.push(obstacles[i].exportObstacle())
                    }
                }
            }
        }
        return output
    }
}
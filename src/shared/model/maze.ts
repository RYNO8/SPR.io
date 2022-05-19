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

    // populate maze with false, populate mazeTime with 0
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

    // populate ornaments with []
    clearOrnaments() {
        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            this.ornaments[row] = []
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                this.ornaments[row][col] = []
            }
        }
    }

    // for testing, put a single triangle near top left
    basicMazeGen() {
        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                if (row == 2 && col == 2) {
                    this.maze[row][col] = true
                    //this.ornaments[row][col] = [makeTriangleObstacle(Date.now(), new Position(row, col).scale(CONSTANTS.CELL_SIZE), CONSTANTS.CELL_SIZE, CONSTANTS.CELL_SIZE, false, false)]
                }
            }
        }
    }

    // populate noise randomly with true/false according to MAZE_DENSITY
    randNoiseGen() {
        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            this.noise[row] = []
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                this.noise[row][col] = randChance(CONSTANTS.MAZE_DENSITY)
            }
        }
    }

    // pos is starting point of bfs, seen indicates whether cell is accounted for already
    // returns all "reachable" positions in no particular order
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

    // remove walls on a path from "start" to "end"
    // current implementation is such that the path is random and roughly linear, but never heading away from the target
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

    // find average of points in each component
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

    // join components into a random subtree (biased?) using randomised krushals
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

    // join components into an MST
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

    // https://en.wikipedia.org/wiki/Gabriel_graph
    joinComponentsGabriel(allCentroids: Position[]) {
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

    // https://en.wikipedia.org/wiki/Relative_neighborhood_graph
    joinComponentsRNG(allCentroids: Position[]) {
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
    

    // at "pos", populate ornaments with triangles to reduce number of sharp square corners
    // erases previous ornaments
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

    // performs cellular automata where decision is based on number of alive 8 neighbours
    // "maze" changed inplace
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

    // https://gamedevelopment.tutsplus.com/tutorials/generate-random-cave-levels-using-cellular-automata--gamedev-9664
    cellAutomataMazeGen() {
        this.maze = this.noise

        for (let rep = 0; rep < CONSTANTS.CA_NUM_STEPS; rep++) this.cellAutomataStep()
        this.joinComponentsGabriel(this.getAllCentroids())
    }

    // find new maze state if current state is complete
    // apply a random change to maze that transitions it towards new maze state
    // apply maze smoothing (optimised)
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
        return !this.isValidCell(mazePos) || this.maze[mazePos.x][mazePos.y]
    }

    // export array of obstacles at this "mazePos"
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

    // determine whether position is blocked by an obstacle
    isPointBlocked(pos: Position) {
        for (let dirI = 0; dirI <= 8; dirI++) {
            let obstacles = this.getObstacles(add(pos, DIRECTIONS_8[dirI]).toMazePos())
            for (let i = 0; i < obstacles.length; i++) {
                if (obstacles[i].covers(pos)) {
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
                let intersection = obstacles[i].rayTrace(startPos, dirVec)
                if (intersection[0] <= best[0]) {
                    //if (best[0] <= 0.02) intersection[2] = new Position(0, 0)
                    best = intersection
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
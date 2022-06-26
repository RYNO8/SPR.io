import * as CONSTANTS from "../shared/constants"
import { Position, add, DIRECTIONS_4, DIRECTIONS_8, findAvg, isEqual, sub } from "../shared/model/position"
import { randChance, randRange, randShuffle } from "../shared/utilities"
import { MazeBase } from "../shared/model/maze"

export class MazeDynamic extends MazeBase {
    public maze: boolean[][] = []
    public noise: boolean[][] = []
    public todo: Position[] = []

    constructor() {
        super()
        // populate noise randomly with true/false according to MAZE_DENSITY
        for (let row = 0; row < CONSTANTS.NUM_CELLS; ++row) {
            this.maze[row] = []
            this.noise[row] = []
            for (let col = 0; col < CONSTANTS.NUM_CELLS; ++col) {
                this.maze[row][col] = false
                this.noise[row][col] = randChance(CONSTANTS.MAZE_DENSITY)
            }
        }
        while (this.todo.length > 0) {
            const mazePos = this.todo.shift()
            this.obstacles[mazePos.y][mazePos.x][0].add()
        }
        while (this.todo.length === 0) {
            this.todo.push(...this.findMutations())
        }
        this.applyMazeSmoothing()
        this.consolePrint()
    }

    // determine if "mazePos" is outside maze bounding box (implicitly all walls)
    // or if it a explicit wall
    isCellBlocked_(mazePos: Position) {
        return !this.isValidCell(mazePos) || this.maze[mazePos.x][mazePos.y]
    }

    // pos is starting point of bfs, seen indicates whether cell is accounted for already
    // returns all "reachable" positions in no particular order
    getComponent(pos: Position, seen: boolean[][]) {
        const allPos: Position[] = []
        const queue: Position[] = []
        queue.push(pos)

        while (queue.length > 0) {
            const curr = queue[0]
            allPos.push(curr)
            queue.shift()

            for (let i = 0; i < 4; ++i) {
                const neighbour = add(curr, DIRECTIONS_4[i])
                if (!this.isCellBlocked_(neighbour) && !seen[neighbour.x][neighbour.y]) {
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
            const dx = Math.abs(end.x - start.x)
            const dy = Math.abs(end.y - start.y)
            if (randChance(dx / (dx + dy))) {
                if (start.x > end.x) --start.x
                else if (start.x < end.x) ++start.x
            } else {
                if (start.y > end.y) --start.y
                else if (start.y < end.y) ++start.y
            }
            this.maze[start.x][start.y] = false
        }
    }

    // find average of points in each component
    getAllCentroids() {
        const seen: boolean[][] = []
        for (let row = 0; row < CONSTANTS.NUM_CELLS; ++row) {
            seen[row] = []
            for (let col = 0; col < CONSTANTS.NUM_CELLS; ++col) {
                seen[row][col] = false
            }
        }

        const allCentroids: Position[] = []
        for (let row = 0; row < CONSTANTS.NUM_CELLS; ++row) {
            for (let col = 0; col < CONSTANTS.NUM_CELLS; ++col) {
                const pos = new Position(col, row)
                if (!this.isCellBlocked_(pos) && !seen[pos.x][pos.y]) {
                    const allPos = this.getComponent(pos, seen)
                    const centroid = findAvg(allPos).floor()
                    allCentroids.push(centroid)
                }
            }
        }
        return allCentroids
    }

    // join components into a random subtree (biased?) using randomised krushals
    joinComponentsRandom(allCentroids: Position[]) {
        const parents: number[] = []
        for (let i = 0; i < allCentroids.length; ++i) parents[i] = i
        function getParent(node: number) {
            if (parents[node] !== node) {
                parents[node] = getParent(parents[node])
            }
            return parents[node]
        }

        // random subtree
        for (let numEdges = 0; numEdges < allCentroids.length - 1; ) {
            const i = randRange(0, allCentroids.length - 1)
            const j = randRange(0, allCentroids.length - 1)
            if (getParent(i) !== getParent(j)) {
                parents[getParent(i)] = getParent(j)
                this.digTunnel(allCentroids[i], allCentroids[j])
                numEdges++
            }
        }
    }

    // join components into an MST
    joinComponentsKruskals(allCentroids: Position[]) {
        const parents: number[] = []
        for (let i = 0; i < allCentroids.length; ++i) parents[i] = i
        function getParent(node: number) {
            if (parents[node] !== node) {
                parents[node] = getParent(parents[node])
            }
            return parents[node]
        }

        // krushals mst
        const allEdges: [number, number, number][] = []
        for (let i = 0; i < allCentroids.length; ++i) {
            for (let j = 0; j < i; ++j) {
                allEdges.push([sub(allCentroids[i], allCentroids[j]).manhattanDist(), i, j])
            }
        }
        allEdges.sort(function(a: [number, number, number], b: [number, number, number]) {
            return a[0] - b[0]
        })
        for (let i = 0; i < allEdges.length; ++i) {
            const a = allEdges[i][1]
            const b = allEdges[i][2]
            if (getParent(a) !== getParent(b)) {
                parents[getParent(a)] = getParent(b)
                this.digTunnel(allCentroids[a], allCentroids[b])
            }
        }
    }

    // https://en.wikipedia.org/wiki/Gabriel_graph
    joinComponentsGabriel(allCentroids: Position[]) {
        for (let i = 0; i < allCentroids.length; ++i) {
            for (let j = 0; j < i; ++j) {
                const mid = findAvg([allCentroids[i], allCentroids[j]])
                const smallestDist = Math.min(
                    sub(allCentroids[i], mid).quadrance(), 
                    sub(allCentroids[j], mid).quadrance()
                )
                let good = true
                for (let k = 0; k < allCentroids.length && good; ++k) {
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
        for (let i = 0; i < allCentroids.length; ++i) {
            for (let j = 0; j < i; ++j) {
                const smallestDist = sub(allCentroids[i], allCentroids[j]).quadrance()
                let good = true
                for (let k = 0; k < allCentroids.length && good; ++k) {
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

    // performs cellular automata where decision is based on number of alive 8 neighbours
    // "maze" changed inplace
    cellAutomataStep() {
        const newMaze: boolean[][] = []
        for (let row = 0; row < CONSTANTS.NUM_CELLS; ++row) {
            newMaze[row] = []
            for (let col = 0; col < CONSTANTS.NUM_CELLS; ++col) {
                const pos = new Position(col, row)
                let numAlive = 0
                for (let i = 0; i < 8; ++i) {
                    if (this.isValidCell(add(pos, DIRECTIONS_8[i])) && this.isCellBlocked_(add(pos, DIRECTIONS_8[i]))) {
                        numAlive++
                    }
                }

                if (this.isCellBlocked_(pos)) {
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

        for (let rep = 0; rep < CONSTANTS.CA_NUM_STEPS; ++rep) this.cellAutomataStep()
        //this.joinComponentsGabriel(this.getAllCentroids())
        //this.joinComponentsRNG(this.getAllCentroids())
        this.joinComponentsRandom(this.getAllCentroids())
    }

    findMutations() {
        const pos: Position = new Position(0, 0)
        do {
            pos.x = randRange(0, CONSTANTS.NUM_CELLS - 1)
            pos.y = randRange(0, CONSTANTS.NUM_CELLS - 1)
        } while (this.noise[pos.x][pos.y] === randChance(CONSTANTS.MAZE_DENSITY))
        this.noise[pos.x][pos.y] = !this.noise[pos.x][pos.y]

        const oldMaze = this.maze
        this.cellAutomataMazeGen()

        const todo: Position[] = []
        for (let row = 0; row < CONSTANTS.NUM_CELLS; ++row) {
            for (let col = 0; col < CONSTANTS.NUM_CELLS; ++col) {
                if (oldMaze[row][col] !== this.maze[row][col]) {
                    todo.push(new Position(col, row))
                }
            }
        }
        this.maze = oldMaze
        
        randShuffle(todo)
        return todo
    }

    // find new maze state if current state is complete
    // apply a random change to maze that transitions it towards new maze state
    // apply maze smoothing (optimised)
    update() {
        while (this.todo.length === 0) {
            this.todo.push(...this.findMutations())
        }

        const numReps = randRange(1, 10)
        for (let i = 0; i < numReps && this.todo.length; ++i) {
            const mazePos = this.todo.shift()
            this.obstacles[mazePos.y][mazePos.x][0].setTo(this.obstacles[mazePos.y][mazePos.x][0].existsBefore(Date.now()))
        }
        
        this.applyMazeSmoothing()
    }
}
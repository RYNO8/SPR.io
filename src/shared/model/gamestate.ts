import { GameObject } from "./../model/game_object"
import { Player, copyPlayer } from "./player"
import { Powerup, copyPowerup } from "./powerup"
import * as CONSTANTS from "../constants"
// maintain global data about other peoples positions & speeds & directions

export class ClientGameState {
    public time: number = 0
    public players: Player[] = []
    public powerups: Powerup[] = []
    public maze: [number, number][] = []
    
    constructor(time_: number, players_: Player[], powerups_: Powerup[], maze_ : [number, number][]) {
        this.time = time_
        for (let i in players_) {
            this.players.push(copyPlayer(players_[i]))
        }
        for (let i in powerups_) {
            this.powerups.push(copyPowerup(powerups_[i]))
        }
        this.powerups = powerups_
        this.maze = maze_
    }
}

export class ServerGameState {
    public time: number = 0
    public players: { [id: string]: Player } = {}
    public powerups: Powerup[] = []
    public maze: boolean[][] = []

    constructor() {
        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            this.maze[row] = []
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                this.maze[row][col] = false
            }
        }
        //this.dfsMazeGen(0, 0)
        this.randMazeGen()
    }

    dfsMazeGen(row: number, col: number) {
        this.maze[row][col] = false

        for (let rep = 0; rep < 10; rep++) {
            let i = Math.floor(Math.random() * 4)
            let dRow: number = <any>(i == 0) - <any>(i == 1)
            let dCol: number = <any>(i == 2) - <any>(i == 3)
            if (0 <= row + 2 * dRow && row + 2 * dRow < CONSTANTS.NUM_CELLS && 0 <= col + 2 * dCol && col + 2 * dCol <= CONSTANTS.NUM_CELLS && this.maze[row + 2 * dRow][col + 2 * dCol]) {
                this.maze[row + dRow][col + dCol] = false
                this.dfsMazeGen(row + 2 * dRow, col + 2 * dCol)
            }
        }
    }

    randMazeGen() {
        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                this.maze[row][col] = Math.random() < CONSTANTS.MAZE_DENSITY
            }
        }
    }

    //////////////////////////// PLAYER ////////////////////////////
    updatePlayer(id: string, newDirection: number) {
        if (id in this.players) {
            this.players[id].direction = newDirection
        }
    }

    getPlayer(id: string) {
        if (id in this.players) {
            return this.players[id]
        } else {
            return null
        }
    }

    getPlayers(): Player[] {
        return Object.values(this.players)
    }

    getPlayersPriority(targetID: string) {
        let others: Player[] = []
        let me: Player = null
        for (let id in this.players) {
            if (id == targetID) {
                me = this.players[id]
            } else {
                others.push(this.players[id])
            }
        }
        others.sort(function(p1: Player, p2: Player) {
            return p1.score - p2.score
        })
        if (me) {
            others.push(me)
        }
        return others
    }

    setPlayer(p: Player) {
        this.players[p.id] = p
    }

    remPlayer(id: string) {
        if (id in this.players) {
            delete this.players[id]
        }
    }

    //////////////////////////// POWERUP ////////////////////////////
    
    getPowerups() {
        return Object.values(this.powerups)
    }

    //////////////////////////// MAZE ////////////////////////////
    
    getMaze() {
        let output = []
        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                if (this.maze[row][col]) {
                    output.push([row * CONSTANTS.CELL_SIZE, col * CONSTANTS.CELL_SIZE]);
                }
            }
        }
        return output
    }

    //////////////////////////// GAME UTILITIES ////////////////////////////
    progress() {
        this.time = Date.now()
        for (let id in this.players) {
            this.players[id].progress(this.maze)
        }

        let toRemove: string[] = []
        let toIncr: string[] = []
        // TODO: O(n^2) yikes
        // https://news.ycombinator.com/item?id=13266692
        // At first I tried checking every creature for collisions against everything else, but unsurprisingly that was too slow (N^2). To reduce the checks I put each creature in a grid cell based on their position, then check for collisions only against creatures in the same or adjacent cells.
        // I think overlapping grids would be even more efficient, or perhaps to do these checks on GPU.
        // Use a quadtree or similar structure for your broadphase detection, it will help right off the bat.
        for (let id1 in this.players) {
            for (let id2 in this.players) {
                if (id1 < id2 && this.players[id1].hasCapture(this.players[id2])) {
                    toIncr.push(id1)
                    toRemove.push(id2)
                }
                else if (id1 < id2 && this.players[id2].hasCapture(this.players[id1])) {
                    toIncr.push(id2)
                    toRemove.push(id1)
                }
            }
        }

        for (let i in toRemove) {
            this.remPlayer(toRemove[i])
        }
        for (let i in toIncr) {
            if (toIncr[i] in this.players) {
                this.players[toIncr[i]].increment()
            }
        }

        let remainingPowerups: Powerup[] = []
        for (let i in this.powerups) {
            let captured = false
            for (let id in this.players) {
                if (this.players[id].canAttack(this.powerups[i])) {
                    captured = true
                    this.players[id].hasPowerup = Date.now() + CONSTANTS.POWERUP_DURATION
                }
            }
            if (!captured) {
                remainingPowerups.push(this.powerups[i])
            }
        }
        this.powerups = remainingPowerups

        if (this.powerups.length < CONSTANTS.POWERUP_MAX && Math.random() <= CONSTANTS.POWERUP_RATE * CONSTANTS.SERVER_TIMESTEP) {
            this.powerups.push(new Powerup())
        }

        if (Math.random() <= CONSTANTS.MAZE_CHANGE_RATE * CONSTANTS.SERVER_TIMESTEP) {
            let x: number
            let y: number
            do {
               x = Math.floor(Math.random() * CONSTANTS.NUM_CELLS)
               y = Math.floor(Math.random() * CONSTANTS.NUM_CELLS)
            } while (this.maze[x][y] == (Math.random() < CONSTANTS.MAZE_DENSITY))
            this.maze[x][y] = !this.maze[x][y]
        }
    }

    exportState(id : string) {
        // TODO: make custom packet for each player
        return {
            time: this.time,
            players: this.getPlayersPriority(id),
            powerups: this.getPowerups(),
            maze: this.getMaze()
        }
    }
}
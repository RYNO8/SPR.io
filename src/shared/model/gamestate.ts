import { GameObject } from "./../model/game_object"
import { Player, copyPlayer } from "./player"
import { Powerup, copyPowerup } from "./powerup"
import { Maze } from "./maze"
import * as CONSTANTS from "../constants"// maintain global data about other peoples positions & speeds & directions


export class ClientGameState {
    public time: number = 0
    public players: Player[] = []
    public powerups: Powerup[] = []
    public maze: [number, number][] = []
    
    constructor(time: number, players: Player[], powerups: Powerup[], maze: [number, number][]) {
        this.time = time
        this.players = players.map(copyPlayer)
        this.powerups = powerups.map(copyPowerup)
        this.maze = maze
    }
}

export class ServerGameState {
    public time: number = 0
    public players: { [id: string]: Player } = {}
    public powerups: Powerup[] = []
    public maze: Maze
    public me: { [id: string]: string } = {}

    constructor() {
        this.time = Date.now()
        this.maze = new Maze()
    }

    /////////////////////////////////////////////////////////////////
    //////////////////////////// PLAYER ////////////////////////////
    /////////////////////////////////////////////////////////////////

    setPlayerDirection(id: string, newDirection: number) {
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

    setPlayer(p: Player) {
        this.players[p.id] = p
    }

    remPlayer(id: string) {
        if (id in this.players) {
            delete this.players[id]
        }
    }

    updatePlayers() {
        
        for (let id in this.players) {
            this.players[id].progress()
            let [x, y] = this.maze.clamp(this.players[id].x, this.players[id].y)
            this.players[id].x = x
            this.players[id].y = y
        }
    }

    updateCaptures() {
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
    }

    exportPlayers(me: Player) {
        let others: Player[] = []
        for (let id in this.players) {
            if (!me || (id != me.id && me.isVisible(this.players[id]))) {
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

    /////////////////////////////////////////////////////////////////
    //////////////////////////// POWERUP ////////////////////////////
    /////////////////////////////////////////////////////////////////

    isPointOccupied(x: number, y: number) {
        for (let i in this.powerups) {
            // TODO: this is very sus, pls fix
            if (this.powerups[i].canAttack({x: x, y: y, canAttack: null})) {
                return true
            }
        }
        return false
    }

    updatePowerups() {
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
            let [x, y] = this.getSpawnPos()
            this.powerups.push(new Powerup(x, y))
        }
    }

    exportPowerups(me: Player) {
        return Object.values(this.powerups.filter(function(powerup: Powerup) {
            return !me || me.isVisible(powerup)
        }))
    }

    /////////////////////////////////////////////////////////////////
    ///////////////////////////// MAZE //////////////////////////////
    /////////////////////////////////////////////////////////////////

    updateMaze() {
        if (Math.random() <= CONSTANTS.MAZE_CHANGE_RATE * CONSTANTS.SERVER_TIMESTEP) {
            let x: number
            let y: number
            do {
               [x, y] = this.getSpawnPos()
               x = Math.floor(x / CONSTANTS.CELL_SIZE)
               y = Math.floor(y / CONSTANTS.CELL_SIZE)
            } while (this.maze.maze[x][y] == (Math.random() <= CONSTANTS.MAZE_DENSITY))
            this.maze.maze[x][y] = !this.maze.maze[x][y]
        }
    }
    
    exportMaze(me: Player) {
        let output = []
        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                let x = row * CONSTANTS.CELL_SIZE
                let y = col * CONSTANTS.CELL_SIZE
                // TODO: this is sus, pls fix
                if (this.maze.maze[row][col] && (!me || me.isVisible({x: x + CONSTANTS.CELL_SIZE / 2, y: y + CONSTANTS.CELL_SIZE / 2, canAttack: null}))) {
                    output.push([x, y])
                }
            }
        }
        return output
    }

    /////////////////////////////////////////////////////////////////
    ///////////////////////////// GAME //////////////////////////////
    /////////////////////////////////////////////////////////////////

    getSpawnPos() {
        let x: number
        let y: number
        do {
            x = Math.floor(Math.random() * CONSTANTS.NUM_CELLS) * CONSTANTS.CELL_SIZE + CONSTANTS.CELL_SIZE / 2
            y = Math.floor(Math.random() * CONSTANTS.NUM_CELLS) * CONSTANTS.CELL_SIZE + CONSTANTS.CELL_SIZE / 2
        } while (this.maze.isPointBlocked(x, y) || this.isPointOccupied(x, y))
        return [x, y]
    }

    update() {
        // TODO: think about best order
        this.time = Date.now()
        this.updatePlayers()
        this.updateCaptures()
        this.updatePowerups()
        this.updateMaze()
    }

    exportState(id : string) {
        // TODO: make custom packet for each player
        let me = this.getPlayer(id)
        return {
            time: this.time,
            players: this.exportPlayers(me),
            powerups: this.exportPowerups(me),
            maze: this.exportMaze(me)
        }
    }
}
import { GameObject } from "./game_object"
import { Player } from "./player"
import { Powerup } from "./powerup"
import { Maze } from "./maze"
import { Position } from "./position"
import * as CONSTANTS from "../constants"// maintain global data about other peoples positions & speeds & directions
import { findBotDirection } from "../ai/util"
import { randChoice, randRange } from "../utilities"
import { randomBytes } from "crypto"

export class ServerGameState {
    public time: number = 0
    public players: { [id: string]: Player } = {}
    public powerups: Powerup[] = []
    public maze: Maze
    public me: { [id: string]: string } = {}

    constructor() {
        this.time = Date.now()
        this.maze = new Maze()
        setInterval(() => this.update(), CONSTANTS.SERVER_UPDATE_RATE)
        setInterval(() => this.updateBots(), CONSTANTS.SERVER_BOT_UPDATE_RATE)
    }

    /////////////////////////////////////////////////////////////////
    //////////////////////////// PLAYER ////////////////////////////
    /////////////////////////////////////////////////////////////////

    setPlayerDirection(id: string, newDirection: number) {
        if (id in this.players && newDirection != NaN) {
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

    // get player with max score, break ties arbitarily
    getDefaultPlayer() {
        if (this.getPlayers().length == 0) {
            return null
        }
        return this.getPlayers().reduce(function(p1: Player, p2: Player) {
            return (p1.score > p2.score) ? p1 : p2
        })
    }

    getPlayers(): Player[] {
        return Object.values(this.players)
    }

    playerJoin(id: string) {
        if (id in this.players) {
            delete this.players[id]
        }
        if (this.getPlayers().length == 0) {
            this.me[id] = null
        } else {
            this.me[id] = this.getDefaultPlayer().id
        }
    }

    playerEnter(id: string, name: string, isBot: boolean) {
        this.players[id] = new Player(this.getSpawnCentroid(), id, name, isBot)
        this.me[id] = id
    }

    playerExit(id: string, attackerID: string) {
        if (this.players[id].isBot) {
            this.playerLeave(id)
        } else {
            if (id in this.players) {
                delete this.players[id]
            }
            this.me[id] = attackerID
        }
    }

    playerLeave(id: string) {
        if (id in this.players) {
            delete this.players[id]
        }
        if (id in this.me) {
            delete this.me[id]
        }
    }

    updateBots() {
        let numBots = 0
        for (let id in this.players) {
            numBots += <any>this.players[id].isBot
        }
        if (Math.random() <= CONSTANTS.BOT_SPAWN_RATE * CONSTANTS.SERVER_BOT_UPDATE_RATE && numBots < CONSTANTS.BOTS_MAX) {
            let newID = randomBytes(20).toString("hex")
            this.playerJoin(newID)
            this.playerEnter(newID, randChoice(CONSTANTS.BOT_NAMES), true)
        }

        for (let id in this.players) {
            if (this.players[id].isBot) {
                let direction = findBotDirection(this.players[id], this)
                this.setPlayerDirection(id, direction)
            }
        }
    }

    updatePlayers() {
        for (let id in this.players) {
            this.players[id].progress(this.maze)
        }
    }

    updateCaptures() {
        // TODO: O(n^2) yikes
        // https://news.ycombinator.com/item?id=13266692
        // At first I tried checking every creature for collisions against everything else, but unsurprisingly that was too slow (N^2). To reduce the checks I put each creature in a grid cell based on their position, then check for collisions only against creatures in the same or adjacent cells.
        // I think overlapping grids would be even more efficient, or perhaps to do these checks on GPU.
        // Use a quadtree or similar structure for your broadphase detection, it will help right off the bat.
        let attacker: { [id: string]: string } = {}
        for (let id1 in this.players) {
            for (let id2 in this.players) {
                if (this.players[id2].hasCapture(this.players[id1])) {
                    this.players[id2].increment()
                    attacker[id1] = id2
                }
            }
        }

        for (let id in attacker) {
            this.playerExit(id, attacker[id])
        }
    }

    exportPlayers(me: Player) {
        let others: Player[] = []
        for (let id in this.players) {
            if (!me || (id != me.id && me.isVisible(this.players[id]))) {
                others.push(this.players[id])
            }
        }
        return others.sort(function(p1: Player, p2: Player) {
            return p1.score - p2.score
        })
    }

    /////////////////////////////////////////////////////////////////
    //////////////////////////// POWERUP ////////////////////////////
    /////////////////////////////////////////////////////////////////

    
    isPointOccupied(v: Position) {
        for (let i in this.powerups) {
            if (this.powerups[i].canAttack(new GameObject(v))) {
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

        if (this.powerups.length < CONSTANTS.POWERUP_MAX && Math.random() <= CONSTANTS.POWERUP_RATE * CONSTANTS.SERVER_UPDATE_RATE) {
            this.powerups.push(new Powerup(this.getSpawnCentroid()))
        }
    }

    exportPowerups(me: Player) {
        return this.powerups.filter(function(powerup: Powerup) {
            return !me || me.isVisible(powerup)
        })
    }

    /////////////////////////////////////////////////////////////////
    ///////////////////////////// MAZE //////////////////////////////
    /////////////////////////////////////////////////////////////////

    updateMaze() {
        // TODO
        /*if (Math.random() <= CONSTANTS.MAZE_CHANGE_RATE * CONSTANTS.SERVER_UPDATE_RATE) {
            let x: number
            let y: number
            do {
               [x, y] = this.getSpawnPos()
               x = Math.floor(x / CONSTANTS.CELL_SIZE)
               y = Math.floor(y / CONSTANTS.CELL_SIZE)
            } while (this.maze.maze[x][y] == (Math.random() <= CONSTANTS.MAZE_DENSITY))
            this.maze.maze[x][y] = !this.maze.maze[x][y]
        }*/
    }

    /////////////////////////////////////////////////////////////////
    ////////////////////////// LEADERBOARD //////////////////////////
    /////////////////////////////////////////////////////////////////

    exportLeaderboard() {
        let sortedPlayers: Player[] = this.getPlayers().sort(function(p1: Player, p2: Player) {
            return p2.score - p1.score
        })
        return sortedPlayers.map(function(p: Player) {
            return [p.name, p.score]
        })
    }

    /////////////////////////////////////////////////////////////////
    ///////////////////////////// GAME //////////////////////////////
    /////////////////////////////////////////////////////////////////

    getSpawnCentroid() {
        let pos = new Position(0, 0)
        do {
            pos.x = randRange(0, CONSTANTS.NUM_CELLS - 1) * CONSTANTS.CELL_SIZE + CONSTANTS.CELL_SIZE / 2
            pos.y = randRange(0, CONSTANTS.NUM_CELLS - 1) * CONSTANTS.CELL_SIZE + CONSTANTS.CELL_SIZE / 2
        } while (this.maze.isPointBlocked(pos) || this.isPointOccupied(pos))
        return pos
    }

    update() {
        // TODO: think about best order
        this.time = Date.now()
        this.updatePlayers()
        this.updatePowerups()
        this.updateCaptures()
        this.updateMaze()
    }

    exportState(id : string) {
        let me = this.getPlayer(id) || this.getDefaultPlayer()
        return {
            time: this.time,
            me: me,
            others: this.exportPlayers(me),
            powerups: this.exportPowerups(me),
            maze: this.maze.exportMaze(me)
        }
    }
}
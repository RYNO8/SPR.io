import { GameObject } from "./../model/game_object"
import { Player, copyPlayer } from "./player"
import { Powerup, copyPowerup } from "./powerup"
import { Maze } from "./maze"
import * as CONSTANTS from "../constants"// maintain global data about other peoples positions & speeds & directions
import { Bot } from "../ai/bot"


export class ClientGameState {
    public time: number = 0
    public me: Player
    public others: Player[] = []
    public powerups: Powerup[] = []
    public maze: [number, number][] = []
    
    constructor(time: number, me: Player, others: Player[], powerups: Powerup[], maze: [number, number][]) {
        this.time = time
        if (me) this.me = copyPlayer(me)
        this.others = others.map(copyPlayer)
        this.powerups = powerups.map(copyPowerup)
        this.maze = maze
    }
    
    update(targetState: ClientGameState, framerate: number) {
        if (this.me && targetState.me) targetState.me.updatePlayer(this.me, 1 - CONSTANTS.INTERPOLATE_SPEED * framerate)
        for (let i in targetState.others) {
            let prev = this.others.find(function(value: Player) { return value.id == targetState.others[i].id })
            if (prev) {
                targetState.others[i].updatePlayer(prev, 1 - CONSTANTS.INTERPOLATE_SPEED * framerate)
            }
        }
        this.me = targetState.me
        this.others = targetState.others
        this.powerups = targetState.powerups
        this.maze = targetState.maze
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

        for (let i=0; i < CONSTANTS.AMOUNT_BOTS; i++) {
            const botId = `bot_${i}`;

            let [x, y] = this.getSpawnPos()
            this.players[botId] = new Bot(botId, CONSTANTS.BOT_NAMES[i % CONSTANTS.BOT_NAMES.length], x, y);
        }
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

    playerEnter(id: string, name: string) {
        let [x, y] = this.getSpawnPos()
        this.players[id] = new Player(id, name, x, y)
        this.me[id] = id
    }

    playerExit(id: string, attackerID: string) {
        if (id in this.players) {
            if(this.players[id].isBot) {
                // Bots respawn instantly
                // dirty hack to prevent client thinking the bot is moving a long distance
                let newId;
                if(id.endsWith('x')) {
                    newId = id.substring(0,id.length-1);
                } else {
                    newId = id + 'x';
                }
                let [x, y] = this.getSpawnPos()
                this.players[newId] = new Bot(newId, this.players[id].name, x, y)
            }

            delete this.players[id]
        }
        this.me[id] = attackerID
    }

    playerLeave(id: string) {
        if (id in this.players) {
            delete this.players[id]
        }
        if (id in this.me) {
            delete this.me[id]
        }
    }

    updatePlayers() {
        for (let id in this.players) {
            const {[id]: player, ...otherPlayers} = this.players;

            player.progress(this.maze, Object.values(otherPlayers), this.powerups);
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

        if (this.powerups.length < CONSTANTS.POWERUP_MAX && Math.random() <= CONSTANTS.POWERUP_RATE * CONSTANTS.SERVER_UPDATE_RATE) {
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
        if (Math.random() <= CONSTANTS.MAZE_CHANGE_RATE * CONSTANTS.SERVER_UPDATE_RATE) {
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
        this.updatePowerups()
        this.updateCaptures()
        this.updateMaze()
    }

    exportState(id : string) {
        // TODO: make custom packet for each player
        let me = this.getPlayer(id) || this.getDefaultPlayer()
        return {
            time: this.time,
            me: me,
            others: this.exportPlayers(me),
            powerups: this.exportPowerups(me),
            maze: this.exportMaze(me)
        }
    }
}
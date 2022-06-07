import { GameObject } from "../shared/model/game_object"
import { Player } from "../shared/model/player"
import { Powerup } from "../shared/model/powerup"
import { Maze } from "../shared/model/maze"
import { add, DIRECTIONS_8, Position, sub } from "../shared/model/position"
import * as CONSTANTS from "../shared/constants"// maintain global data about other peoples positions & speeds & directions
import { findBotDirection } from "./ai/util"
import { isString, randChance, randChoice, randRange, genID } from "../shared/utilities"


export class ServerGameState {
    // time that this gamestate represents
    public time: number = 0
    // dictionary of ID's and corresponding players
    public players: { [id: string]: Player } = {}
    // array of powerup objects
    public powerups: Powerup[] = []
    // maze object
    public maze: Maze
    public mazeChangeTime: number = 0
    // dictionary of ID's, and who each player is watching
    // if string, you are watching the player with that ID
    // if Player, you are watching a stationary position (invisible player)
    //      used when labyrinth captured you or labyrinth captured the player that captured you
    public me: { [id: string]: string | Player } = {}
    // when you are captured, attackerName[ID] is the display name of your attacker
    // NOTE: this is MAZE_NAME when captured by labyrinth
    public attackerName: { [id: string]: string } = {}

    constructor() {
        this.time = Date.now()
        this.maze = new Maze()

        // regularly update this gamestate and bots
        // NOTE: different update rates
        setInterval(() => this.update(), CONSTANTS.SERVER_UPDATE_RATE)
        setInterval(() => this.updateBots(), CONSTANTS.SERVER_BOT_UPDATE_RATE)
    }

    /////////////////////////////////////////////////////////////////
    //////////////////////////// PLAYER ////////////////////////////
    /////////////////////////////////////////////////////////////////

    // set player direction from socketio input
    // NOTE: nothing happens when id is invalid or direction is invalid type
    setPlayerDirection(id: string, newDirection: number) {
        if (id in this.players) {
            this.players[id].direction = newDirection
        }
    }

    // get player with max score, break ties arbitarily
    // if no players are present, returns dummy player to map center
    // => on an empty map, spectators look at map center
    getDefaultPlayer() {
        if (this.getPlayers().length === 0) {
            return new Player(new Position(CONSTANTS.MAP_SIZE, CONSTANTS.MAP_SIZE).scale(1/2), CONSTANTS.MAZE_NAME, CONSTANTS.MAZE_NAME, false)
        }
        return this.getPlayers().reduce(function(p1: Player, p2: Player) {
            return (p1.score >= p2.score) ? p1 : p2
        })
    }

    // get all players as an array
    // NOTE: id information are not lost since they are member variables of Player object
    getPlayers(): Player[] {
        return Object.values(this.players)
    }

    // player has entered the maze and is not spectating any more
    playerEnter(id: string, name: string, isBot: boolean) {
        this.players[id] = new Player(this.getSpawnCentroid(), id, name, isBot)
        this.me[id] = id
        if (id in this.attackerName) {
            delete this.attackerName[id]
        }
    }

    // "id" has been captured by "attacker"
    // increment attacker, set attackerName, change me's for players that were observing you, you now exit
    doCapture(id: string, attacker: string | Player) {
        this.me[id] = attacker
        if (isString(attacker)) {
            this.players[attacker].increment()
            this.attackerName[id] = this.players[attacker].name
        } else {
            this.attackerName[id] = attacker.name
        }
        for (let otherID in this.me) {
            if (isString(this.me[otherID]) && this.me[otherID] === id) {
                //console.log(otherID, this.me[otherID])
                this.me[otherID] = new Player(this.players[id].centroid, CONSTANTS.MAZE_NAME, CONSTANTS.MAZE_NAME, false)
            }
        }
        

        if (this.players[id].isBot) {
            this.playerExit(id)
        } else if (id in this.players) {
            delete this.players[id]
        }
    }

    // exit the maze and spectating the person who captured you
    playerExit(id: string) {
        if (id in this.players) {
            delete this.players[id]
        }
        if (id in this.me) {
            delete this.me[id]
        }
        if (id in this.attackerName) {
            delete this.attackerName[id]
        }
    }

    // add bots if necessary, set bot directions
    updateBots() {
        let numBots = 0
        for (let id in this.players) {
            numBots += <any>this.players[id].isBot
        }
        if (randChance(CONSTANTS.BOT_SPAWN_RATE * CONSTANTS.SERVER_BOT_UPDATE_RATE) && numBots < CONSTANTS.BOTS_MAX) {
            let newID = genID()
            this.playerEnter(newID, randChoice(CONSTANTS.BOT_NAMES), true)
        }

        for (let id in this.players) {
            if (this.players[id].isBot) {
                let direction = findBotDirection(this.players[id], this)
                this.setPlayerDirection(id, direction)
            }
        }
    }

    // move all players (and bots) in their directions and apply colllisions
    updatePlayers() {
        for (let id in this.players) {
            if (this.maze.isPointBlocked(this.players[id].centroid)) {
                let attacker = new Player(this.players[id].centroid, CONSTANTS.MAZE_NAME, CONSTANTS.MAZE_NAME, false)
                this.doCapture(id, attacker)
            } else {
                this.players[id].progress(this.maze)
            }
        }
    }

    // find closest attacker in candidates
    findCapture(id1: string, posHash: { [id: number]: string[] }) {
        let attackerDist = Infinity
        let attacker: string = null
        for (let i = 0; i <= 8; ++i) {
            let hash = add(this.players[id1].centroid.toMazePos(), DIRECTIONS_8[i]).hash()
            if (hash in posHash) {
                for (let i in posHash[hash]) {
                    let id2 = posHash[hash][i]
                    let currDist = sub(this.players[id1].centroid, this.players[id2].centroid).quadrance()
                    if (this.players[id2].hasCapture(this.players[id1]) && currDist < attackerDist) {
                        attackerDist = currDist
                        attacker = id2
                    }
                }
            }
        }
        return attacker
    }

    // check captures between all unordered pairs of distinct players
    // optimised by computing mazePos of each player, and only test players with possible nearby attackers
    updateCaptures() {
        let posHash: { [id: number]: string[] } = {}
        for (let id in this.players) {
            let hash = this.players[id].centroid.toMazePos().hash()
            if (hash in posHash) {
                posHash[hash].push(id)
            } else {
                posHash[hash] = [id]
            }
        }

        let newAttackers: { [id: string]: string } = {}
        for (let id1 in this.players) {
            let attacker = this.findCapture(id1, posHash)
            if (attacker) {
                newAttackers[id1] = attacker
            }
        }

        for (let id in newAttackers) {
            this.doCapture(id, newAttackers[id])
        }
    }

    // export all players visible to me, sorted by increasing score (render layers)
    // TODO: optimise, how to precomp?
    exportPlayers(me: Player) {
        let others: Player[] = []
        for (let id in this.players) {
            if (id !== me.id && me.canSee(this.players[id])) {
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

    // whether a player at this position can gain a powerup
    isPointOccupied(v: Position) {
        for (let i in this.powerups) {
            if (this.powerups[i].canAttack(new GameObject(v))) {
                return true
            }
        }
        return false
    }

    // give powerups to players, add powerups if necessary
    updatePowerups() {
        let remainingPowerups: Powerup[] = []
        for (let i in this.powerups) {
            let captured = this.maze.isPointBlocked(this.powerups[i].centroid)
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

        if (this.powerups.length < CONSTANTS.POWERUP_MAX && randChance(CONSTANTS.POWERUP_RATE * CONSTANTS.SERVER_UPDATE_RATE)) {
            this.powerups.push(new Powerup(this.getSpawnCentroid()))
        }
    }

    // export all powerups visible to me
    // TODO: optimise, how to precomp?
    exportPowerups(me: Player) {
        return this.powerups.filter(function(powerup: Powerup) {
            return me.canSee(powerup)
        })
    }

    /////////////////////////////////////////////////////////////////
    ///////////////////////////// MAZE //////////////////////////////
    /////////////////////////////////////////////////////////////////

    // change maze if necessary, remove players in walls
    updateMaze() {
        if (randChance(CONSTANTS.MAZE_CHANGE_RATE * CONSTANTS.SERVER_UPDATE_RATE) && this.mazeChangeTime < Date.now() - CONSTANTS.MAZE_CHANGE_DELAY) {
            this.mazeChangeTime = Date.now()
            this.maze.update()
        }
    }

    /////////////////////////////////////////////////////////////////
    ////////////////////////// LEADERBOARD //////////////////////////
    /////////////////////////////////////////////////////////////////

    // NOTE: called at different rate from the other updates
    // export top players in sorted order as tuple of (name, score)
    // NOTE: if 2 players have the same score, they wont have the same rank (ties broken arbitarily?)
    exportLeaderboard() {
        let sortedPlayers: Player[] = this.getPlayers().sort(function(p1: Player, p2: Player) {
            return p2.score - p1.score
        }).slice(0, CONSTANTS.LEADERBOARD_LEN)
        return sortedPlayers.map(function(p: Player) {
            return [p.name, p.score]
        })
    }

    /////////////////////////////////////////////////////////////////
    ///////////////////////////// GAME //////////////////////////////
    /////////////////////////////////////////////////////////////////

    // find a random position in the center of a cell, which isnt occupied and isnt in a wall
    // NOTE: may take arbitarily long (or infinitely long if no position is available)
    // i.e. maze has been populated by powerups
    getSpawnCentroid() {
        let pos = new Position(0, 0)
        do {
            pos.x = randRange(0, CONSTANTS.NUM_CELLS - 1) * CONSTANTS.CELL_SIZE + CONSTANTS.CELL_SIZE / 2
            pos.y = randRange(0, CONSTANTS.NUM_CELLS - 1) * CONSTANTS.CELL_SIZE + CONSTANTS.CELL_SIZE / 2
        } while (this.maze.isPointBlocked(pos) || this.isPointOccupied(pos))
        return pos
    }

    // update all aspects of gamestate
    update() {
        // TODO: think about best order
        this.time = Date.now()
        this.updateMaze()
        this.updatePlayers()
        this.updatePowerups()
        this.updateCaptures()
    }

    // export everything required for clientside rendering
    exportState(id : string) {
        if (!(id in this.me)) {
            var me = this.getDefaultPlayer()
        } else if (isString(this.me[id])) {
            var me = this.players[<string>this.me[id]]
        } else {
            var me: Player = <Player>this.me[id]
        }
        if (me == null) {
            me = this.getDefaultPlayer()
        }

        return {
            time: this.time,
            attackerName: this.attackerName[id],
            me: me,
            others: this.exportPlayers(me),
            powerups: this.exportPowerups(me),
            maze: this.maze.exportMaze(me)
        }
    }
}
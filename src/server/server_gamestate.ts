import * as CONSTANTS from "../shared/constants"// maintain global data about other peoples positions & speeds & directions
import { GameObject } from "../shared/model/game_object"
import { Player } from "../shared/model/player"
import { Powerup } from "../shared/model/powerup"
import { MazeBase } from "../shared/model/maze"
import { add, DIRECTIONS_8, Position, sub } from "../shared/model/position"
import { findBotDirection } from "./ai/util"
import { isString, randChance, randChoice, randRange, genID, validName, validNumber } from "../shared/utilities"


export class ServerGameState<MazeType extends MazeBase> {
    // time that this gamestate represents
    public time: number = 0
    // dictionary of ID's and corresponding players
    public players: Map<string, Player> = new Map<string, Player>()
    // for room_management to keep track of total players & spectators, for room allocation
    public numPlayers: number = 0
    // array of powerup objects
    public powerups: Powerup[] = []
    // maze object
    public maze: MazeType
    public mazeChangeTime: number = 0
    // dictionary of ID's, and who each player is watching
    // if string, you are watching the player with that ID
    // if Player, you are watching a stationary position (invisible player)
    //      used when labyrinth captured you or labyrinth captured the player that captured you
    public me: Map<string, string | Player> = new Map<string, string | Player>()
    // when you are captured, attackerName[ID] is the display name of your attacker
    // NOTE: this is MAZE_NAME when captured by labyrinth
    public attackerName: Map<string, string> = new Map<string, string>()

    constructor(MazeCreator: { new(): MazeType }) {
        this.time = Date.now()
        this.maze = new MazeCreator()

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
        if (this.players.has(id) && validNumber(newDirection)) {
            this.players.get(id).direction = newDirection
            return true
        }
        return false
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
        if (this.players.has(id) || !validName(name)) {
            return false
        }

        this.players.set(id, new Player(this.getSpawnCentroid(), id, name, isBot))
        this.me.set(id, id)
        this.attackerName.delete(id)
        return true
    }

    // "id" has been captured by "attacker"
    // increment attacker, set attackerName, change me's for players that were observing you, you now exit
    doCapture(id: string, attacker: string | Player) {
        this.me.set(id, attacker)
        if (isString(attacker)) {
            this.players.get(attacker).increment()
            this.attackerName.set(id, this.players.get(attacker).name)
        } else {
            this.attackerName.set(id, attacker.name)
        }
        for (let otherID of this.me.keys()) {
            if (isString(this.me.get(otherID)) && this.me.get(otherID) === id) {
                //console.log(otherID, this.me[otherID])
                this.me.set(otherID, new Player(this.players.get(id).centroid, CONSTANTS.MAZE_NAME, CONSTANTS.MAZE_NAME, false))
            }
        }
        

        if (this.players.get(id).isBot) {
            this.playerExit(id)
        } else if (this.players.has(id)) {
            this.players.delete(id)
        }
    }

    // exit the maze and spectating the person who captured you
    playerExit(id: string) {
        this.players.delete(id)
        this.me.delete(id)
        this.attackerName.delete(id)
    }

    // add bots if necessary, set bot directions
    updateBots() {
        let numBots = 0
        for (let id of this.players.keys()) {
            numBots += <any>this.players.get(id).isBot
        }
        if (randChance(CONSTANTS.BOT_SPAWN_RATE * CONSTANTS.SERVER_BOT_UPDATE_RATE) && numBots < CONSTANTS.BOTS_MAX) {
            let newID = genID()
            this.playerEnter(newID, randChoice(CONSTANTS.BOT_NAMES), true)
        }

        for (let id of this.players.keys()) {
            if (this.players.get(id).isBot) {
                let direction = findBotDirection(this.players.get(id), this)
                this.setPlayerDirection(id, direction)
            }
        }
    }

    // move all players (and bots) in their directions and apply colllisions
    updatePlayers() {
        for (let id of this.players.keys()) {
            if (this.maze.isPointBlocked(this.players.get(id).centroid)) {
                let attacker = new Player(this.players.get(id).centroid, CONSTANTS.MAZE_NAME, CONSTANTS.MAZE_NAME, false)
                this.doCapture(id, attacker)
            } else {
                this.players.get(id).progress(this.maze)
            }
        }
    }

    // find closest attacker in candidates
    findCapture(id1: string, posHash: Map<number, string[]>) {
        let attackerDist = Infinity
        let attacker: string = null
        for (let i = 0; i <= 8; ++i) {
            let hash = add(this.players.get(id1).centroid.toMazePos(), DIRECTIONS_8[i]).hash()
            if (posHash.has(hash)) {
                for (let id2 of posHash.get(hash)) {
                    let currDist = sub(this.players.get(id1).centroid, this.players.get(id2).centroid).quadrance()
                    if (this.players.get(id2).hasCapture(this.players.get(id1)) && currDist < attackerDist) {
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
        let posHash: Map<number, string[]> = new Map<number, string[]>()
        for (let id of this.players.keys()) {
            let hash = this.players.get(id).centroid.toMazePos().hash()
            if (posHash.has(hash)) {
                posHash.get(hash).push(id)
            } else {
                posHash.set(hash, [id])
            }
        }

        let newAttackers: Map<string, string> = new Map<string, string>()
        for (let id1 of this.players.keys()) {
            let attacker = this.findCapture(id1, posHash)
            if (attacker) {
                newAttackers.set(id1, attacker)
            }
        }

        for (let id of newAttackers.keys()) {
            this.doCapture(id, newAttackers.get(id))
        }
    }

    // export all players visible to me, sorted by increasing score (render layers)
    // TODO: optimise, how to precomp?
    exportPlayers(me: Player) {
        let others: Player[] = []
        for (let id of this.players.keys()) {
            if (id !== me.id && me.canSee(this.players.get(id))) {
                others.push(this.players.get(id))
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
        for (let powerup of this.powerups) {
            if (powerup.canAttack(new GameObject(v))) {
                return true
            }
        }
        return false
    }

    // give powerups to players, add powerups if necessary
    updatePowerups() {
        let remainingPowerups: Powerup[] = []
        for (let powerup of this.powerups) {
            let captured = this.maze.isPointBlocked(powerup.centroid)
            for (let id of this.players.keys()) {
                if (this.players.get(id).canAttack(powerup)) {
                    captured = true
                    this.players.get(id).hasPowerup = Date.now() + CONSTANTS.POWERUP_DURATION
                }
            }
            if (!captured) {
                remainingPowerups.push(powerup)
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
            pos.x = (randRange(0, CONSTANTS.NUM_CELLS - 1) + 1/2) * CONSTANTS.CELL_SIZE
            pos.y = (randRange(0, CONSTANTS.NUM_CELLS - 1) + 1/2) * CONSTANTS.CELL_SIZE
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
        if (!this.me.has(id)) {
            var me = this.getDefaultPlayer()
        } else if (isString(this.me.get(id))) {
            var me = this.players.get(<string>this.me.get(id))
        } else {
            var me: Player = <Player>this.me.get(id)
        }
        if (me == null) {
            me = this.getDefaultPlayer()
        }

        return {
            time: this.time,
            attackerName: this.attackerName.get(id),
            me: me,
            others: this.exportPlayers(me),
            powerups: this.exportPowerups(me),
            maze: this.maze.exportMaze(me)
        }
    }
}
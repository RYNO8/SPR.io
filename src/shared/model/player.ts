import * as CONSTANTS from "./../constants"
import { GameObject } from "./game_object"
import { Position, add, sub, DIRECTIONS_4, DIRECTIONS_8 } from "./position"
import { Maze } from "./maze"

export class Player extends GameObject {
    public id: string
    public name!: string
    public team: number
    public score: number
    public isBot: boolean

    public direction: number
    public hasPowerup: number

    constructor(centroid: Position, id: string, name: string, isBot: boolean) {
        super(centroid)

        this.id = id
        this.name = name
        this.isBot = isBot

        // TODO: something better than random, try balancing teams
        this.team = Math.floor(Math.random() * CONSTANTS.NUM_TEAMS)
        this.score = 0
        this.direction = Math.random() * 2 * Math.PI
        this.hasPowerup = 0
    }

    static deserialise(player : Player) {
        let output : Player = new Player(Position.deserialise(player.centroid), player.id, player.name, player.isBot)
        output.team = player.team
        output.score = player.score
        output.direction = player.direction
        output.hasPowerup = player.hasPowerup
        return output
    }

    increment() {
        this.score++
        this.team = (this.team + 1) % CONSTANTS.NUM_TEAMS
    }

    canCapture(p: Player): boolean {
        let mePowerup = this.hasPowerup >= Date.now()
        let otherPowerup = p.hasPowerup >= Date.now()
        if (mePowerup == otherPowerup) {
            return p.team == (this.team + 1) % CONSTANTS.NUM_TEAMS
        } else {
            return mePowerup
        }
    }

    hasCapture(p: Player): boolean {
        return this.id != p.id && this.canAttack(p) && this.canCapture(p)
    }

    
    progress(maze: Maze) {
        let distance = CONSTANTS.PLAYER_SPEED * CONSTANTS.SERVER_UPDATE_RATE
        let dirVec = new Position(Math.cos(this.direction), Math.sin(this.direction)).scale(distance)

        let best: [number, Position] = [Infinity, null]
        for (let i = 0; i < 4; i++) {
            let dir = DIRECTIONS_4[i].scale(CONSTANTS.PLAYER_RADIUS)
            let intersection = maze.rayTrace(add(this.centroid, dir), dirVec)
            intersection[1] = sub(intersection[1], dir)
            if (intersection[0] < best[0]) {
                best = intersection
            }
        }
        this.centroid = best[1]
    }

    getColour(me: Player) {
        /*if (this.team == (me.team + 1) % CONSTANTS.NUM_TEAMS) {
            return CONSTANTS.PLAYER_PREY_COLOUR
        }
        else if (me.team == (this.team + 1) % CONSTANTS.NUM_TEAMS) {
            return CONSTANTS.PLAYER_ENEMY_COLOUR
        }
        else {
            return CONSTANTS.PLAYER_TEAMMATE_COLOUR
        }*/
        if (me.team == 0) {
            return CONSTANTS.PLAYER_PREY_COLOUR
        } else if (me.team == 1) {
            return CONSTANTS.PLAYER_ENEMY_COLOUR
        } else {
            return CONSTANTS.PLAYER_TEAMMATE_COLOUR
        }
    }

    updatePlayer(newPlayer: Player, delta: number) {
        this.centroid = add(this.centroid.scale(1 - delta), newPlayer.centroid.scale(delta))
        this.direction %= 2 * Math.PI
        newPlayer.direction %= 2 * Math.PI
        if (this.direction - newPlayer.direction >= Math.PI) {
            this.direction += (newPlayer.direction - this.direction + 2 * Math.PI) * delta
        } else if (newPlayer.direction - this.direction >= Math.PI) {
            this.direction += (newPlayer.direction - this.direction - 2 * Math.PI) * delta
        } else {
            this.direction += (newPlayer.direction - this.direction) * delta
        }
    }
}

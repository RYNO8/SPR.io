import * as CONSTANTS from "./../constants"
import { GameObject } from "./game_object"
import { Position, add } from "./position"

export class Player extends GameObject {
    public id: string
    public name!: string
    public team: number
    public score: number

    public direction: number
    public hasPowerup: number

    constructor(centroid: Position, id: string, name: string, ) {
        super(centroid)

        this.id = id
        this.name = name
        // TODO: something better than random, try balancing teams
        this.team = Math.floor(Math.random() * CONSTANTS.NUM_TEAMS)
        this.score = 0
        this.direction = Math.random() * 2 * Math.PI
        this.hasPowerup = 0
    }

    static deserialise(player : Player) {
        let output : Player = new Player(Position.deserialise(player.centroid), player.id, player.name)
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

    hasCapture(p: Player): boolean {
        if (this.id != p.id && this.canAttack(p)) {
            let mePowerup = this.hasPowerup >= Date.now()
            let otherPowerup = p.hasPowerup >= Date.now()
            if (mePowerup == otherPowerup) {
                return p.team == (this.team + 1) % CONSTANTS.NUM_TEAMS
            } else {
                return mePowerup
            }
        }
    }

    
    progress() {
        let distance = CONSTANTS.PLAYER_SPEED * CONSTANTS.SERVER_UPDATE_RATE
        // TODO: abstract
        this.centroid.x += Math.cos(this.direction) * distance
        this.centroid.y += Math.sin(this.direction) * distance
    }

    getColour(me: Player) {
        if (this.team == (me.team + 1) % CONSTANTS.NUM_TEAMS) {
            return CONSTANTS.PLAYER_PREY_COLOUR
        }
        else if (me.team == (this.team + 1) % CONSTANTS.NUM_TEAMS) {
            return CONSTANTS.PLAYER_ENEMY_COLOUR
        }
        else {
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

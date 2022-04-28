import * as CONSTANTS from "./../constants"
import { GameObject } from "./game_object"

export class Player extends GameObject {
    public id: string
    public name!: string
    public team: number
    public score: number

    public x: number
    public y: number
    public direction: number
    public hasPowerup: number

    constructor(id: string, name: string, x: number, y: number) {
        super(x, y)

        this.id = id
        this.name = name
        // TODO: something better than random, try balancing teams
        this.team = Math.floor(Math.random() * CONSTANTS.NUM_TEAMS)
        this.score = 0
        this.direction = Math.random() * 2 * Math.PI
        this.hasPowerup = 0
    }

    isVisible(obj: GameObject) {
        return (
            Math.abs(obj.x - this.x) <= CONSTANTS.VISIBLE_WIDTH / 2 + CONSTANTS.VISIBLE_BUFFER && 
            Math.abs(obj.y - this.y) <= CONSTANTS.VISIBLE_HEIGHT / 2 + CONSTANTS.VISIBLE_BUFFER
        )
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
                p.team == (this.team + 1) % CONSTANTS.NUM_TEAMS
            } else {
                return mePowerup
            }
        }
    }

    progress() {
        let distance = CONSTANTS.PLAYER_SPEED * CONSTANTS.SERVER_TIMESTEP
        this.x += Math.cos(this.direction) * distance
        this.y += Math.sin(this.direction) * distance
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
        this.x = this.x * (1 - delta) + newPlayer.x * delta
        this.y = this.y * (1 - delta) + newPlayer.y * delta
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

// why is js/ts so stupid
export function copyPlayer(player : Player) {
    let output : Player = new Player(player.id, player.name, player.x, player.y)
    output.team = player.team
    output.score = player.score
    output.direction = player.direction
    output.hasPowerup = player.hasPowerup
    return output
}
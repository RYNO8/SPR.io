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

    constructor(id: string, name: string) {
        super()

        this.id = id
        this.name = name
        // TODO: something better than random, try balancing teams
        this.team = Math.floor(Math.random() * CONSTANTS.NUM_TEAMS)
        this.score = 0
        this.direction = 0
        this.hasPowerup = 0
    }

    increment() {
        this.score++
        this.team = (this.team + 1) % CONSTANTS.NUM_TEAMS
    }
    hasCapture(p: Player): boolean {
        let canCapture = p.team == (this.team + 1) % CONSTANTS.NUM_TEAMS || (this.hasPowerup >= Date.now() && p.hasPowerup < Date.now())
        return canCapture && this.canAttack(p)
    }

    progress() {
        let distance = CONSTANTS.PLAYER_SPEED * CONSTANTS.SERVER_TIMESTEP
        this.x += Math.sin(this.direction) * distance
        this.y -= Math.cos(this.direction) * distance
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
    let output : Player = new Player(player.id, player.name)
    output.team = player.team
    output.score = player.score
    output.x = player.x
    output.y = player.y
    output.direction = player.direction
    output.hasPowerup = player.hasPowerup
    return output
}
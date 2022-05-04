import * as CONSTANTS from "./../constants"
import { GameObject } from "./game_object"
import { Position, add, sub, DIRECTIONS_4 } from "./position"
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
        /*let bestLambda = 0
        let best = null
        
        for (let i = 0; i < 4; i++) {
            let intersection = maze.rayTrace(add(this.centroid, DIRECTIONS_4[i].scale(CONSTANTS.PLAYER_RADIUS)), dirVec)
            if (intersection[0] > bestLambda && intersection[0] < 1) {
                bestLambda = intersection[0]
                best = sub(intersection[1], DIRECTIONS_4[i].scale(CONSTANTS.PLAYER_RADIUS))
            }
        }
        if (best) this.centroid = best
        else this.centroid = add(this.centroid, dirVec)*/
        this.centroid = maze.rayTrace(this.centroid, dirVec)[1]
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

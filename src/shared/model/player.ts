import * as CONSTANTS from "./../constants"
import { GameObject } from "./game_object"
import { Position, add, DIRECTIONS_4 } from "./position"
import { Maze } from "./maze"
import { randRange } from "../utilities"

export class Player extends GameObject {
    public id: string
    public name!: string
    public team: number
    public score: number
    public isBot: boolean
    public isVisible: boolean = true

    public direction: number
    public hasPowerup: number

    constructor(centroid: Position, id: string, name: string, isBot: boolean) {
        super(centroid)

        this.id = id
        this.name = name
        this.isBot = isBot
        if (id == CONSTANTS.MAZE_NAME && name == CONSTANTS.MAZE_NAME) {
            this.isVisible = false
        }
        
        // TODO: something better than random, try balancing teams
        this.team = randRange(0, CONSTANTS.NUM_TEAMS - 1)
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
        this.centroid = maze.rayTrace(this.centroid, dirVec)
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
        if (this.team == 0) {
            return CONSTANTS.PLAYER_PREY_COLOUR
        } else if (this.team == 1) {
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

    canSee(o: GameObject) {
        return (
            Math.abs(o.centroid.x - this.centroid.x) <= CONSTANTS.VISIBLE_WIDTH / 2 + CONSTANTS.VISIBLE_BUFFER && 
            Math.abs(o.centroid.y - this.centroid.y) <= CONSTANTS.VISIBLE_HEIGHT / 2 + CONSTANTS.VISIBLE_BUFFER
        )
    }
}

import { GameObject } from "./game_object"
import { Player } from "./player"
import { Powerup } from "./powerup"
import { Maze } from "./maze"
import { Obstacle } from "./obstacle"
import { Position } from "./position"
import * as CONSTANTS from "../constants"// maintain global data about other peoples positions & speeds & directions
import { findBotDirection } from "../ai/util"
import { randChoice, randRange } from "../utilities"
import { randomBytes } from "crypto"

export class ClientGameState {
    public time: number = 0
    public attackerName: string = null
    public me: Player = null
    public others: Player[] = []
    public powerups: Powerup[] = []
    public maze: Obstacle[] = []
    
    constructor(time: number, attackerName: string, me: Player, others: Player[], powerups: Powerup[], maze: Obstacle[]) {
        this.time = time
        this.attackerName = attackerName
        if (me) this.me = Player.deserialise(me)
        this.others = others.map(Player.deserialise)
        this.powerups = powerups.map(Powerup.deserialise)
        this.maze = maze.map(Obstacle.deserialise)
    }
    
    update(targetState: ClientGameState, framerate: number) {
        let lambda = CONSTANTS.INTERPOLATE_SPEED * framerate
        
        this.time = this.time * lambda + targetState.time * (1 - lambda)

        this.attackerName = targetState.attackerName

        if (this.me && targetState.me) targetState.me.updatePlayer(this.me, 1 - lambda)
        this.me = targetState.me
        
        
        for (let i in targetState.others) {
            let prev = this.others.find(function(value: Player) { return value.id == targetState.others[i].id })
            if (prev) {
                targetState.others[i].updatePlayer(prev, 1 - lambda)
            }
        }
        this.others = targetState.others

        this.powerups = targetState.powerups
        this.maze = targetState.maze
    }
}
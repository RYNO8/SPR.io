import * as CONSTANTS from "../shared/constants"
import { Player } from "../shared/model/player"
import { Powerup } from "../shared/model/powerup"
import { Obstacle, ClientObstacle } from "../shared/model/obstacle"
import { MazeBase } from "../shared/model/maze"
import { Position } from "../shared/model/position"

export class ClientGameState {
    public time: number = 0
    public attackerName: string = null
    public me: Player = null
    public others: Player[] = []
    public powerups: Powerup[] = []
    public maze: Obstacle[] = []
    
    constructor(time: number, attackerName: string | null, me: Player, others: Player[], powerups: Powerup[], maze: ClientObstacle[]) {
        this.time = time
        this.attackerName = attackerName
        if (me) this.me = Player.deserialisePlayer(me)
        this.others = others.map(Player.deserialisePlayer)
        this.powerups = powerups.map(Powerup.deserialisePowerup)
        this.maze = []
        for (const obstacle of maze) {
            this.maze.push(Obstacle.deserialiseObstacle(obstacle))
        }
    }
    
    update(targetState: ClientGameState, framerate: number) {
        const lambda = CONSTANTS.INTERPOLATE_SPEED * framerate
        
        this.time = this.time * lambda + targetState.time * (1 - lambda)

        this.attackerName = targetState.attackerName

        if (this.me && targetState.me) targetState.me.updatePlayer(this.me, 1 - lambda)
        this.me = targetState.me
        
        
        for (const other of targetState.others) {
            const prev = this.others.find(value => value.id === other.id)
            if (prev) {
                other.updatePlayer(prev, 1 - lambda)
            }
        }
        this.others = targetState.others

        this.powerups = targetState.powerups
        this.maze = targetState.maze
    }
}
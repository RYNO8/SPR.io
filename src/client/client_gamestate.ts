import * as CONSTANTS from "../shared/constants"
import { Player } from "../shared/model/player"
import { Powerup } from "../shared/model/powerup"
import { Obstacle } from "../shared/model/obstacle"
import { MazeBase } from "../shared/model/maze"
import { Position } from "../shared/model/position"

let obstacleCache = new MazeBase()

export class ClientGameState {
    public time: number = 0
    public attackerName: string = null
    public me: Player = null
    public others: Player[] = []
    public powerups: Powerup[] = []
    public maze: Obstacle[] = []
    
    constructor(time: number, attackerName: string, me: Player, others: Player[], powerups: Powerup[], maze: [number, number, number, number, number][]) {
        this.time = time
        this.attackerName = attackerName
        if (me) this.me = Player.deserialise(me)
        this.others = others.map(Player.deserialise)
        this.powerups = powerups.map(Powerup.deserialise)
        this.maze = []
        for (let val of maze) {
            let mazePos = new Position(val[0], val[1])
            let obstacle = obstacleCache.getObstacles(mazePos)[val[2]]
            obstacle.startTime = val[3]
            obstacle.endTime = val[4]
            this.maze.push(obstacle)
        }
    }
    
    update(targetState: ClientGameState, framerate: number) {
        let lambda = CONSTANTS.INTERPOLATE_SPEED * framerate
        
        this.time = this.time * lambda + targetState.time * (1 - lambda)

        this.attackerName = targetState.attackerName

        if (this.me && targetState.me) targetState.me.updatePlayer(this.me, 1 - lambda)
        this.me = targetState.me
        
        
        for (let other of targetState.others) {
            let prev = this.others.find(value => value.id === other.id)
            if (prev) {
                other.updatePlayer(prev, 1 - lambda)
            }
        }
        this.others = targetState.others

        this.powerups = targetState.powerups
        this.maze = targetState.maze
    }
}
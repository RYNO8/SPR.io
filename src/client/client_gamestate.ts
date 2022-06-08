import * as CONSTANTS from "../shared/constants"
import { Player } from "../shared/model/player"
import { Powerup } from "../shared/model/powerup"
import { Obstacle } from "../shared/model/obstacle"
import { Maze } from "../shared/model/maze"
import { Position } from "../shared/model/position"

let obstacleCache = new Maze()

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
        for (let i in maze) {
            let mazePos = new Position(maze[i][0], maze[i][1])
            let obstacle = obstacleCache.getObstacles(mazePos)[maze[i][2]]
            obstacle.startTime = maze[i][3]
            obstacle.endTime = maze[i][4]
            this.maze.push(obstacle)
        }
    }
    
    update(targetState: ClientGameState, framerate: number) {
        let lambda = CONSTANTS.INTERPOLATE_SPEED * framerate
        
        this.time = this.time * lambda + targetState.time * (1 - lambda)

        this.attackerName = targetState.attackerName

        if (this.me && targetState.me) targetState.me.updatePlayer(this.me, 1 - lambda)
        this.me = targetState.me
        
        
        for (let i in targetState.others) {
            let prev = this.others.find(function(value: Player) { return value.id === targetState.others[i].id })
            if (prev) {
                targetState.others[i].updatePlayer(prev, 1 - lambda)
            }
        }
        this.others = targetState.others

        this.powerups = targetState.powerups
        this.maze = targetState.maze
    }
}
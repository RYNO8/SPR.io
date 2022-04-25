import { Player, interpolatePlayer, copyPlayer } from "./player"
import { Powerup } from "./powerup"
import * as CONSTANTS from "./../constants"
// maintain global data about other peoples positions & speeds & directions

export class GameState {
    public time: number = 0
    public players: { [id : string]: Player } = {}
    public powerups : Powerup[] = []

    constructor() {

    }

    //////////////////////////// POWERUP ////////////////////////////
    
    getPowerups() {
        return Object.values(this.powerups)
    }

    //////////////////////////// PLAYER ////////////////////////////
    updatePlayer(id : string, newDirection : number) {
        if (id in this.players) {
            this.players[id].direction = newDirection
        }
    }

    getPlayer(id : string) {
        if (id in this.players) {
            return this.players[id]
        }
        else {
            return null
        }
    }

    getPlayers() {
        return Object.values(this.players)
    }

    setPlayer(p : Player) {
        this.players[p.id] = p
    }

    remPlayer(id : string) {
        if (id in this.players) {
            delete this.players[id]
        }
    }

    //////////////////////////// GAME UTILITIES ////////////////////////////
    progress(time_step : number) {
        this.time = Date.now()
        for (let id in this.players) {
            this.players[id].progress(time_step)
        }

        let toRemove : string[] = []
        let toIncr : string[] = []
        // TODO: O(n^2) yikes
        // https://news.ycombinator.com/item?id=13266692
        // At first I tried checking every creature for collisions against everything else, but unsurprisingly that was too slow (N^2). To reduce the checks I put each creature in a grid cell based on their position, then check for collisions only against creatures in the same or adjacent cells.
        // I think overlapping grids would be even more efficient, or perhaps to do these checks on GPU.
        // Use a quadtree or similar structure for your broadphase detection, it will help right off the bat.
        for (let id1 in this.players) {
            for (let id2 in this.players) {
                if (id1 < id2 && this.players[id1].hasCapture(this.players[id2])) {
                    toIncr.push(id1)
                    toRemove.push(id2)
                }
                else if (id1 < id2 && this.players[id2].hasCapture(this.players[id1])) {
                    toIncr.push(id2)
                    toRemove.push(id1)
                }
            }
        }

        for (let i in toRemove) {
            this.remPlayer(toRemove[i])
        }
        for (let i in toIncr) {
            if (toIncr[i] in this.players) {
                this.players[toIncr[i]].increment()
            }
        }

        if (this.powerups.length < CONSTANTS.POWERUP_MAX && Math.random() < CONSTANTS.POWERUP_RATE * CONSTANTS.SERVER_TIME_STEP) {
            this.powerups.push(new Powerup())
        }
    }

    exportState() {
        return {
            time: this.time,
            players: this.getPlayers(),
            powerups: this.getPowerups()
        }
    }
}

export function importState(jsonstate : any) : GameState {
    let gamestate : GameState = new GameState()
    gamestate.time = jsonstate.time
    jsonstate.players.forEach(function(jsonplayer : Player) {
        gamestate.setPlayer(copyPlayer(jsonplayer))
    })
    gamestate.powerups = jsonstate.powerups
    return gamestate
}

export function interpolate(state1 : GameState, state2 : GameState, percentage1 : number, percentage2 : number) {
    let output : GameState = new GameState()
    output.powerups = state1.powerups

    state1.getPlayers().forEach(function(player : Player) {
        if (player.id in state2.players) {
            let newPlayer : Player = interpolatePlayer(player, state2.players[player.id], percentage1, percentage2)
            output.setPlayer(newPlayer)
        }
        else {
            output.setPlayer(player)
        }
    })
    state2.getPlayers().forEach(function(player : Player) {
        if (!(player.id in state1.players)) {
            output.setPlayer(player)
        }
    })

    return output
}

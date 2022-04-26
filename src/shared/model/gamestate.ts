import { Player, copyPlayer } from "./player"
import { Powerup, copyPowerup } from "./powerup"
import * as CONSTANTS from "../constants"
// maintain global data about other peoples positions & speeds & directions

export class ClientGameState {
    public time: number = 0
    public players: Player[] = []
    public powerups: Powerup[] = []

    constructor(time_: number, players_: Player[], powerups_: Powerup[]) {
        this.time = time_
        for (let i in players_) {
            this.players.push(copyPlayer(players_[i]))
        }
        for (let i in powerups_) {
            this.powerups.push(copyPowerup(powerups_[i]))
        }
        this.powerups = powerups_
    }
}

export class ServerGameState {
    public time: number = 0
    public players: { [id: string]: Player } = {}
    public powerups: Powerup[] = []

    constructor() {

    }

    //////////////////////////// POWERUP ////////////////////////////
    
    getPowerups() {
        return Object.values(this.powerups)
    }

    //////////////////////////// PLAYER ////////////////////////////
    updatePlayer(id: string, newDirection: number) {
        if (id in this.players) {
            this.players[id].direction = newDirection
        }
    }

    getPlayer(id: string) {
        if (id in this.players) {
            return this.players[id]
        }
        else {
            return null
        }
    }

    getPlayers(): Player[] {
        return Object.values(this.players)
    }

    setPlayer(p: Player) {
        this.players[p.id] = p
    }

    remPlayer(id: string) {
        if (id in this.players) {
            delete this.players[id]
        }
    }

    getHighestPlayer() {
        // TODO: how to tiebreak scores?
        let highest = this.players[0]
        for (let id in this.players) {
            if (this.players[id].score > highest.score) {
                highest = this.players[id]
            }
        }
        return highest
    }

    //////////////////////////// GAME UTILITIES ////////////////////////////
    progress(timeStep: number) {
        this.time = Date.now()
        for (let id in this.players) {
            this.players[id].progress(timeStep)
        }

        let toRemove: string[] = []
        let toIncr: string[] = []
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

        let remainingPowerups: Powerup[] = []
        for (let i in this.powerups) {
            let captured = false
            for (let id in this.players) {
                if (this.players[id].canAttack(this.powerups[i])) {
                    captured = true
                    this.players[id].hasPowerup = Date.now() + CONSTANTS.POWERUP_DURATION
                }
            }
            if (!captured) {
                remainingPowerups.push(this.powerups[i])
            }
        }
        this.powerups = remainingPowerups

        if (this.powerups.length < CONSTANTS.POWERUP_MAX && Math.random() < CONSTANTS.POWERUP_RATE * CONSTANTS.SERVER_TIMESTEP) {
            this.powerups.push(new Powerup())
        }
    }

    exportState() {
        return {
            time: this.time,
            players: this.getPlayers(), // TODO: order players by increasing priority
            powerups: this.getPowerups()
        }
    }
}
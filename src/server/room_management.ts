import * as CONSTANTS from "../shared/constants"
import { ServerGameState } from "./server_gamestate"

export class Rooms {
    public nextRoomID: number = 0
    public rooms: Map<number, ServerGameState> = new Map<number, ServerGameState>()

    constructor() {
    }

    // thanks Luke
    joinRoom() {
        let p1: number[] = []
        let p2: number[] = []
        this.rooms.forEach((gamestate, i) => {
            console.assert(gamestate.numPlayers > 0)
            if (gamestate.numPlayers < CONSTANTS.ROOM_THRESHOLD) {
                p1.push(i)
            } else {
                p2.push(i)
            }
        })

        let best = -1
        if (p1.length > 0) {
            for (let i of p1) {
                if (best === -1 || this.rooms.get(i).numPlayers > this.rooms.get(best).numPlayers) {
                    best = i
                }
            }
        } else if (p2.length > 0) {
            for (let i of p2) {
                if (best === -1 || this.rooms.get(i).numPlayers < this.rooms.get(best).numPlayers) {
                    best = i
                }
            }
        } else {
            best = ++this.nextRoomID
            this.rooms.set(this.nextRoomID, new ServerGameState())
        }

        this.rooms.get(best).numPlayers++
        //this.printRooms()
        return best
    }

    leaveRoom(id: number) {
        this.rooms.get(id).numPlayers--;
        if (this.rooms.get(id).numPlayers == 0) {
            this.rooms.delete(id)
        }
        //this.printRooms()
    }

    printRooms() {
        this.rooms.forEach((gamestate, i) => {
            console.log(i, gamestate.numPlayers)
        })
    }

    getRoom(id: number) {
        return this.rooms.get(id)
    }
}
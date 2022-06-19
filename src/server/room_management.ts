import * as CONSTANTS from "../shared/constants"
import { ServerGameState } from "./server_gamestate"
import { MazeBase } from "../shared/model/maze"

export class Rooms<MazeType extends MazeBase> {
    public nextRoomID: number = 0
    public rooms: Map<number, ServerGameState<MazeType>> = new Map<number, ServerGameState<MazeType>>()
    public MazeCreator: { new(): MazeType }

    constructor(MazeCreator: { new(): MazeType }) {
        this.MazeCreator = MazeCreator
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
            this.rooms.set(this.nextRoomID, new ServerGameState(this.MazeCreator))
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
            console.log("room", i, "has", gamestate.numPlayers, "player(s).")
        })
    }

    getRoom(id: number) {
        return this.rooms.get(id)
    }
}
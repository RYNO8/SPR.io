import * as CONSTANTS from "./../constants"
import { Position } from "./position"

// for testing, put a single triangle near top left
export class MazeGenStub {
    public isInit = true
    constructor() {
    }

    findMutations() {
        if (this.isInit) {
            this.isInit = false
            return [new Position(2, 2)]
        } else {
            return [new Position(5, 5)]
        }
    }
}

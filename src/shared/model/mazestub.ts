import { Position } from "./position"
import { MazeBase } from "./maze"

export class MazeStub extends MazeBase {
    constructor() {
        super()
        this.update(true)
        this.consolePrint()
    }

    update(isInit: boolean) {
        if (isInit) {
            for (let mazePos of [new Position(2, 2), new Position(2, 4)]) {
                this.obstacles[mazePos.x][mazePos.y][0].add()
            }
        } else {
            for (let mazePos of [new Position(3, 3)]) {
                this.obstacles[mazePos.x][mazePos.y][0].setTo(this.obstacles[mazePos.x][mazePos.y][0].existsBefore(Date.now()))
            }
        }
    }
}

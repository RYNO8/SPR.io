import { Position } from "../shared/model/position"
import { MazeBase } from "../shared/model/maze"

export class MazeStub extends MazeBase {
    constructor() {
        super()
        for (const mazePos of [new Position(2, 2), new Position(2, 4)]) {
            this.obstacles[mazePos.y][mazePos.x][0].add()
        }
        this.applyMazeSmoothing()
    }

    update() {
        for (const mazePos of [new Position(3, 3)]) {
            this.obstacles[mazePos.y][mazePos.x][0].setTo(this.obstacles[mazePos.y][mazePos.x][0].existsBefore(Date.now(), 0))
        }
        this.applyMazeSmoothing()
    }
}

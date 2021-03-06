import * as CONSTANTS from "../shared/constants"
import { Position } from "../shared/model/position"
import { MazeBase } from "../shared/model/maze"

const mazeLayout14 = [
    [1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1],
    [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
    [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
    [1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1],
]
const mazeLayout10 = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 0, 0, 0, 0, 0, 0, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 1, 1, 0, 0, 0, 1],
    [1, 0, 0, 1, 1, 1, 1, 0, 0, 1],
    [1, 0, 0, 1, 1, 1, 1, 0, 0, 1],
    [1, 0, 0, 0, 1, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 0, 0, 0, 0, 0, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
]
const mazeLayout = mazeLayout10

export class MazeColoured extends MazeBase {
    constructor() {
        super()
        for (let row = 0; row < mazeLayout.length; ++row) {
            for (let col = 0; col < mazeLayout[row].length; ++col) {
                if (row < CONSTANTS.NUM_CELLS && col < CONSTANTS.NUM_CELLS && mazeLayout[row][col]) {
                    this.obstacles[row][col][0].add()
                }
            }
        }
        
        for (const pos of [[1, 4], [1, 5], [2, 4], [2, 5]]) {
            this.obstacles[pos[0]][pos[1]][0].setSome([0])
        }

        for (const pos of [[6, 3], [7, 2]]) {
            this.obstacles[pos[0]][pos[1]][0].setSome([1])
        }

        for (const pos of [[6, 6], [7, 7]]) {
            this.obstacles[pos[0]][pos[1]][0].setSome([2])
        }
        this.applyMazeSmoothing()
        this.consolePrint()
    }

    // dont change anything, this maze is static
    update() {
        
    }
}

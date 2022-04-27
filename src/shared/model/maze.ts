import * as CONSTANTS from "./../constants"
import { Player } from "./player"

function randDirection() {
    let i = Math.floor(Math.random() * 4)
    let dRow: number = <any>(i == 0) - <any>(i == 1)
    let dCol: number = <any>(i == 2) - <any>(i == 3)
    return [dRow, dCol]
}

export class Maze {
    public maze: boolean[][] = []

    constructor() {
        //this.randMazeGen()

        /*for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            this.maze[row] = []
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                this.maze[row][col] = false
            }
        }
        this.dfsMazeGen(0, 0)*/

        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            this.maze[row] = []
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                this.maze[row][col] = true
            }
        }
        this.randwalkMazeGen()
        
    }

    randMazeGen() {
        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                this.maze[row][col] = Math.random() < CONSTANTS.MAZE_DENSITY
            }
        }
    }

    dfsMazeGen(row: number, col: number) {
        this.maze[row][col] = false

        for (let rep = 0; rep < 10; rep++) {
            let [dRow, dCol] = randDirection()
            if (0 <= row + 2 * dRow && row + 2 * dRow < CONSTANTS.NUM_CELLS && 0 <= col + 2 * dCol && col + 2 * dCol <= CONSTANTS.NUM_CELLS && this.maze[row + 2 * dRow][col + 2 * dCol]) {
                this.maze[row + dRow][col + dCol] = false
                this.dfsMazeGen(row + 2 * dRow, col + 2 * dCol)
            }
        }
    }

    randwalkMazeGen() {
        // these constants are specific to CONSTANTS.NUM_CELLS == 20
        // TODO: test if these constants scale linearly with NUM_CELLS
        // tested using https://cdpn.io/abdolsa/fullembedgrid/zEKdop?animations=run&type=embed
        let NUM_TUNNELS = 90
        let MAX_LENGTH = 7

        let mazeX = Math.floor(CONSTANTS.NUM_CELLS / 2)
        let mazeY = Math.floor(CONSTANTS.NUM_CELLS / 2)
        let prevdx = 0
        let prevdy = 0
        for (let rep = 0; rep < NUM_TUNNELS; rep++) {
            let dx: number
            let dy: number
            do {
                [dx, dy] = randDirection()
            } while (dx == prevdx && dy == prevdy)

            let length = Math.floor(Math.random() * MAX_LENGTH)
            for (let i = 0; i < length && this.isValidCell(mazeX + dx, mazeY + dy); i++) {
                this.maze[mazeX][mazeY] = false
                mazeX += dx
                mazeY += dy
                prevdx = dx
                prevdy = dy
            }
            this.maze[mazeX][mazeY] = false
        }
    }

    isValidCell(mazeX: number, mazeY: number) {
        return 0 <= mazeX && mazeX < CONSTANTS.NUM_CELLS && 0 <= mazeY && mazeY < CONSTANTS.NUM_CELLS
    }

    getCell(mazeX: number, mazeY: number) {
        return !this.isValidCell(mazeX, mazeY) || this.maze[mazeX][mazeY]
    }

    isPointBlocked(x: number, y: number) {
        return this.getCell(Math.floor(x / CONSTANTS.CELL_SIZE), Math.floor(y / CONSTANTS.CELL_SIZE))
    }

    isRegionBlocked(x1: number, y1: number, x2: number, y2: number) {
        x2 = Math.ceil(x2 / CONSTANTS.CELL_SIZE) * CONSTANTS.CELL_SIZE
        y2 = Math.ceil(y2 / CONSTANTS.CELL_SIZE) * CONSTANTS.CELL_SIZE
        for (let x = x1; x < x2; x += CONSTANTS.CELL_SIZE) {
            for (let y = y1; y < y2; y += CONSTANTS.CELL_SIZE) {
                if (this.isPointBlocked(x, y)) {
                    return true
                }
            }
        }
        return false
    }

    clamp(x: number, y: number): [number, number] {
        let mazeX = Math.floor(x / CONSTANTS.CELL_SIZE)
        let mazeY = Math.floor(y / CONSTANTS.CELL_SIZE)

        let leftBound = mazeX * CONSTANTS.CELL_SIZE + CONSTANTS.PLAYER_RADIUS
        let rightBound = (mazeX + 1) * CONSTANTS.CELL_SIZE - CONSTANTS.PLAYER_RADIUS
        let topBound = mazeY * CONSTANTS.CELL_SIZE + CONSTANTS.PLAYER_RADIUS
        let bottomBound = (mazeY + 1) * CONSTANTS.CELL_SIZE - CONSTANTS.PLAYER_RADIUS

        // edges
        if (this.getCell(mazeX - 1, mazeY)) {
            x = Math.max(x, leftBound)
        }
        if (this.getCell(mazeX + 1, mazeY)) {
            x = Math.min(x, rightBound)
        }
        if (this.getCell(mazeX, mazeY - 1)) {
            y = Math.max(y, topBound)
        }
        if (this.getCell(mazeX, mazeY + 1)) {
            y = Math.min(y, bottomBound)
        }

        // corners
        if (this.getCell(mazeX - 1, mazeY + 1) && x <= leftBound && y >= bottomBound) {
            if (leftBound - x < y - bottomBound) x = leftBound
            else y = bottomBound
        }
        if (this.getCell(mazeX + 1, mazeY + 1) && x >= rightBound && y >= bottomBound) {
            if (x - rightBound < y - bottomBound) x = rightBound
            else y = bottomBound
        }
        if (this.getCell(mazeX - 1, mazeY - 1) && x <= leftBound && y <= topBound) {
            if (leftBound - x < topBound - y) x = leftBound
            else y = topBound
        }
        if (this.getCell(mazeX + 1, mazeY - 1) && x >= rightBound && y <= topBound) {
            if (x - rightBound < topBound - y) x = rightBound
            else y = topBound
        }

        return [x, y]
    }
}
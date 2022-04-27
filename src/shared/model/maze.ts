import * as CONSTANTS from "./../constants"
import { Player } from "./player"

export class Maze {
    public maze: boolean[][] = []

    constructor() {
        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            this.maze[row] = []
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                this.maze[row][col] = false
            }
        }
        //this.dfsMazeGen(0, 0)
        this.randMazeGen()
    }

    dfsMazeGen(row: number, col: number) {
        this.maze[row][col] = false

        for (let rep = 0; rep < 10; rep++) {
            let i = Math.floor(Math.random() * 4)
            let dRow: number = <any>(i == 0) - <any>(i == 1)
            let dCol: number = <any>(i == 2) - <any>(i == 3)
            if (0 <= row + 2 * dRow && row + 2 * dRow < CONSTANTS.NUM_CELLS && 0 <= col + 2 * dCol && col + 2 * dCol <= CONSTANTS.NUM_CELLS && this.maze[row + 2 * dRow][col + 2 * dCol]) {
                this.maze[row + dRow][col + dCol] = false
                this.dfsMazeGen(row + 2 * dRow, col + 2 * dCol)
            }
        }
    }

    randMazeGen() {
        for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
            for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
                this.maze[row][col] = Math.random() < CONSTANTS.MAZE_DENSITY
            }
        }
    }

    getCell(mazeX: number, mazeY: number) {
        return mazeX < 0 || mazeX >= CONSTANTS.NUM_CELLS || mazeY < 0 || mazeY >= CONSTANTS.NUM_CELLS || this.maze[mazeX][mazeY]
    }

    isPointBlocked(x: number, y: number) {
        return !this.getCell(Math.floor(x / CONSTANTS.CELL_SIZE), Math.floor(y / CONSTANTS.CELL_SIZE))
    }

    isRegionBlocked(x1: number, y1: number, x2: number, y2: number) {
        x2 = Math.ceil(x2 / CONSTANTS.CELL_SIZE) * CONSTANTS.CELL_SIZE
        y2 = Math.ceil(y2 / CONSTANTS.CELL_SIZE) * CONSTANTS.CELL_SIZE
        for (let x = x1; x < x2; x += CONSTANTS.CELL_SIZE) {
            for (let y = y1; y < y2; y += CONSTANTS.CELL_SIZE) {
                if (this.isPointBlocked(x, y) == false) {
                    return false
                }
            }
        }
        return true
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
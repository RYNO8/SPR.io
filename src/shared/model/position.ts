import * as CONSTANTS from "../constants"

export class Position {
    public x: number
    public y: number

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }

    
    static deserialise(pos: Position) {
        return new Position(pos.x, pos.y)
    }

    quadrance() {
        return this.x * this.x + this.y * this.y
    }

    euclideanDist() {
        return Math.sqrt(this.quadrance())
    }

    manhattanDist() {
        return Math.abs(this.x) + Math.abs(this.y)
    }
    
    scale(lambda: number) {
        return new Position(lambda * this.x, lambda * this.y)
    }

    floor() {
        return new Position(Math.floor(this.x), Math.floor(this.y))
    }

    ceil() {
        return new Position(Math.ceil(this.x), Math.ceil(this.y))
    }
}

export function add(a: Position, b: Position) {
    return new Position(a.x + b.x, a.y + b.y)
}

export function sub(a: Position, b: Position) {
    return new Position(a.x - b.x, a.y - b.y)
}

export function isEqual(a: Position, b: Position) {
    //return a.x == b.x && a.y == b.y
    return sub(a, b).quadrance() <= CONSTANTS.EPSILON
}

export function dotProd(a: Position, b: Position) {
    return a.x * b.x + a.y * b.y
}

export function skewProd(a: Position, b: Position) {
    return a.x * b.y - a.y * b.x
}

export function ccw(a: Position, b: Position, c: Position) {
    return (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)
}

// point p0, distance from line through p1 and p2
// https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line#Line_defined_by_two_points
export function pointLineDist(pos0: Position, pos1: Position, pos2: Position) {
    return ccw(pos1, pos2, pos0) / sub(pos1, pos2).euclideanDist()
}
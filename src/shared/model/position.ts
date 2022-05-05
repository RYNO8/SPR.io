import * as CONSTANTS from "../constants"
import { quadrance } from "../utilities"

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
export let DIRECTIONS_4 = [
    new Position(1, 0),
    new Position(-1, 0),
    new Position(0, 1),
    new Position(0, -1),
    new Position(0, 0)
]
export let DIRECTIONS_8 = [
    new Position(1, 0),
    new Position(-1, 0),
    new Position(0, 1),
    new Position(0, -1),
    new Position(1, 1),
    new Position(1, -1),
    new Position(-1, 1),
    new Position(-1, -1),
    new Position(0, 0)
]

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

export function proj(from: Position, onto: Position) {
    return onto.scale(dotProd(from, onto) / onto.quadrance())
}

// UNTESTED
export function ccw(a: Position, b: Position, c: Position) {
    return (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)
}

// UNTESTED
// point p0, distance from line through p1 and p2
// https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line#Line_defined_by_two_points
export function pointLineDist(pos0: Position, pos1: Position, pos2: Position) {
    return ccw(pos1, pos2, pos0) / sub(pos1, pos2).euclideanDist()
}

export function lineLineIntersection(startPos1: Position, dir1: Position, startPos2: Position, dir2: Position): [number, Position, Position] {
    // startPos1 + lambda * dir1 == startPos2 + t * dir2
    // lambda * skewProd(dir1, dir2) == skewProd(startPos2 - startPos1, dir2)
    let numerator = skewProd(sub(startPos2, startPos1), dir2)
    let denominator = skewProd(dir1, dir2)

    let lambda = numerator / denominator
    let mu = skewProd(sub(startPos2, startPos1), dir1) / denominator

    if (Math.abs(denominator) < CONSTANTS.EPSILON) {        
        if (Math.abs(numerator) < CONSTANTS.EPSILON) {
            // lines are parallel and intersecting
            return [0, startPos1, new Position(0, 0)]
        } else {
            // lines are parallel and non intersecting
            return [Infinity, null, null]
        }
    } else {
        
        
        if (0 <= lambda && lambda <= 1 && -CONSTANTS.EPSILON <= mu && mu <= 1 + CONSTANTS.EPSILON) {
            // lines are intersecting on segment
            lambda -= 0.2
            let endPos1 = add(startPos1, dir1.scale(lambda))
            let slide = proj(dir1, dir2).scale((1 - lambda) * CONSTANTS.MAZE_WALL_SMOOTHNESS)
            return [lambda, endPos1, slide]
        } else {
            // lines are intersecting outside segment
            return [Infinity, null, null]
        }
    }
}

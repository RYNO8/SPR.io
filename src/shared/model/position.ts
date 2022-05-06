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

    rotate(theta: number) {
        return new Position(
            this.x*Math.cos(theta) - this.y*Math.sin(theta),
            this.x*Math.sin(theta) + this.y*Math.cos(theta)
        )
    }

    floor() {
        return new Position(Math.floor(this.x), Math.floor(this.y))
    }

    ceil() {
        return new Position(Math.ceil(this.x), Math.ceil(this.y))
    }

    toMazePos() {
        return this.scale(1 / CONSTANTS.CELL_SIZE).floor()
    }

    hash() {
        return this.x + CONSTANTS.NUM_CELLS * this.y
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

export let ALL_POS: Position[] = []
for (let row = 0; row < CONSTANTS.NUM_CELLS; row++) {
    for (let col = 0; col < CONSTANTS.NUM_CELLS; col++) {
        ALL_POS.push(new Position(row, col))
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

export function findAvg(posArr: Position[]) {
    return posArr.reduce(function(p1: Position, p2: Position) {
        return add(p1, p2)
    }).scale(1 / posArr.length)
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
    let denominator = skewProd(dir1, dir2)
    let lambda = skewProd(sub(startPos2, startPos1), dir2) / denominator
    let mu = skewProd(sub(startPos2, startPos1), dir1) / denominator
    //console.log(mu)
    if (Number.isNaN(lambda)) {
        // lines are parallel and intersecting
        return [0, startPos1, new Position(0, 0)]
    } else if (!Number.isFinite(lambda)) {
        // lines are parallel and non intersecting
        return [Infinity, null, null]
    } else if (0 <= lambda && lambda <= 1 && -CONSTANTS.EPSILON <= mu && mu <= 1 + CONSTANTS.EPSILON) {
        // lines are intersecting on segment
        //console.log(mu)
        lambda -= 0.1
        let endPos1 = add(startPos1, dir1.scale(lambda))
        let slide = proj(dir1, dir2).scale((1 - lambda) * CONSTANTS.MAZE_WALL_SMOOTHNESS)
        return [lambda, endPos1, slide]
    } else {
        // lines are intersecting outside segment
        return [Infinity, null, null]
    }
}

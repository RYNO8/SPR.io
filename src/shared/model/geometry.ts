export class Vector {
    public x: number
    public y: number

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
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
        return new Vector(lambda * this.x, lambda * this.y)
    }
}

export function add(a: Vector, b: Vector) {
    return new Vector(a.x + b.x, a.y + b.y)
}

export function sub(a: Vector, b: Vector) {
    return new Vector(a.x - b.x, a.y - b.y)
}

export function isEqual(a: Vector, b: Vector) {
    // TODO: epsilon, or use dist
    return a.x == b.x && a.y == b.y
}

export function dotProd(a: Vector, b: Vector) {
    return a.x * b.x + a.y * b.y
}

export function skewProd(a: Vector, b: Vector) {
    return a.x * b.y - a.y * b.x
}

export function ccw(a: Vector, b: Vector, c: Vector) {
    return (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)
}

// point p0, distance from line through p1 and p2
// https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line#Line_defined_by_two_points
export function pointLineDist(p0: Vector, p1: Vector, p2: Vector) {
    return ccw(p1, p2, p0) / sub(p1, p2).euclideanDist()
}

export class Polygon {
    public points: Vector[] = []

    clamp(p: Vector) {
        if (this.points.length <= 2) {
            return p
        }
        for (let i = 0; i < this.points.length; i++) {
            let j = (i + 1) % this.points.length
            console.log(pointLineDist(p, this.points[i], this.points[j]))
        }
        console.log(".")
        return p
    }
}
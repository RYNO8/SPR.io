import { randomBytes } from "crypto"

// if value is string, with typeguard
export function isString(val: any): val is string {
    return typeof(val) === "string"
}
// basic check for username
// NOTE: done on backend to prevent dodgy client hacks
export function validName(name: string) {
    return isString(name) && 1 <= name.length && name.length <= 20
}

export function validNumber(num: number) {
    return typeof num === "number" && !Number.isNaN(num) && Number.isFinite(num)
}

// chose ranodm value in array
export function randChoice(arr: any[]) {
    return arr[Math.floor(Math.random() * arr.length)]
}

// chose random integer in [min..max]
export function randRange(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

// return true with probability p
export function randChance(p: number) {
    //console.assert(0 <= p && p <= 1)
    return Math.random() <= p
}

// random shuffle array in place, not biased
export function randShuffle(arr: any[]) {
    for (let i = arr.length - 1; i > 0; --i) {
        const j = randRange(0, i)
        const temp = arr[i]
        arr[i] = arr[j]
        arr[j] = temp
    }
}


export function genID() {
    return randomBytes(20).toString("hex")
}

export function clamp(x: number) {
    return Math.max(0, Math.min(1, x))
}

// input: h in [0,360] and s,v in [0,1] - output: r,g,b in [0,1]
export function HSVtoRGB(colour: {h: number, s: number, v: number}) {
    const f = function(n: number) {
        const k = (n+colour.h/60)%6
        return Math.round(255 * colour.v * (1 - colour.s*Math.max( Math.min(k,4-k,1), 0)))
    }
    return {
        r: f(5),
        g: f(3),
        b: f(1)
    }
}

// store rolling average and difference of a sliding window of numbers
export class RollingAvg {
    private sample_size: number
    private defaultValue: number
    private values: number[] = []
    private totalSum: number = 0
    private totalDiff: number = 0

    constructor(sample_size: number, defaultValue: number) {
        this.sample_size = sample_size
        this.defaultValue = defaultValue
    }
    
    update(value: number) {
        // push from right
        this.totalSum += value
        if (this.values.length - 1 >= 0) this.totalDiff += value - this.values[this.values.length - 1]
        this.values.push(value)

        if (this.values.length > this.sample_size) {
            // pop from left
            this.totalSum -= this.values[0]
            if (this.values.length >= 1) this.totalDiff -= this.values[1] - this.values[0]
            this.values.shift()
        }
    }

    getAvg() {
        if (this.values.length === 0) {
            return this.defaultValue
        } else {
             return this.totalSum / this.values.length
        }
    }

    getDiff() {
        if (this.values.length <= 1) {
            return this.defaultValue
        } else {
             return this.totalDiff / (this.values.length - 1)
        }
    }
}
export function quadrance(x1: number, y1: number, x2: number, y2: number) {
    return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)
}

export function validName(name: string) {
    return 1 <= name.length && name.length <= 20
}

export function randChoice(arr: any[]) {
    return arr[Math.floor(Math.random() * arr.length)]
}

// chose integer in [min..max]
export function randRange(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

export class RollingAvg {
    private sample_size: number
    private defaultValue: number
    private values: number[] = []
    private total: number = 0

    constructor(sample_size: number, defaultValue: number) {
        this.sample_size = sample_size
        this.defaultValue = defaultValue
    }
    
    update(value: number) {
        this.total += value
        this.values.push(value) // push from right
        if (this.values.length > this.sample_size) {
            this.total -= this.values[0]
            this.values.shift() // pop from left
        }
    }

    getAvg() {
        if (this.values.length == 0) {
            return this.defaultValue
        } else {
             return this.total / this.values.length
        }
    }

    getDiff() {
        if (this.values.length <= 1) {
            return this.defaultValue
        } else {
             return (this.values[this.values.length - 1] - this.values[0]) / (this.values.length - 1)
        }
    }
}
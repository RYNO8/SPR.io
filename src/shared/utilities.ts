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

export function randChance(p: number) {
    console.assert(0 <= p && p <= 1)
    return Math.random() <= p
}

export function randShuffle(arr: any[]) {
    for (let i = arr.length - 1; i > 0; i--) {
        let j = randRange(0, i)
        let temp = arr[i]
        arr[i] = arr[j]
        arr[j] = temp
    }
}

export function isString(val: any): val is string {
    return typeof(val) == "string"
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
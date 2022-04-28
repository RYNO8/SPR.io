export function quadrance(x1: number, y1: number, x2: number, y2: number) {
    return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)
}

export function validName(name: string) {
    return 1 <= name.length && name.length <= 20
}
import * as CONSTANTS from "./../constants"

export class GameObject {
    public x: number
    public y: number

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }

    canAttack(o: GameObject): boolean {
        let quadrance = (this.x - o.x) * (this.x - o.x) + (this.y - o.y) * (this.y - o.y)
        return quadrance <= 2 * CONSTANTS.PLAYER_RADIUS * CONSTANTS.PLAYER_RADIUS
    }
}

// why is js/ts so stupid
export function copyGameObject(gameObject : GameObject) {
    return new GameObject(gameObject.x, gameObject.y)
}
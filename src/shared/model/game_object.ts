import * as CONSTANTS from "./../constants"

export class GameObject {
    public x: number
    public y: number

    constructor() {
        // TODO: something better than random, avoid other game objects
        this.x = Math.floor(Math.random() * CONSTANTS.NUM_CELLS) * CONSTANTS.CELL_SIZE + CONSTANTS.CELL_SIZE / 2
        this.y = Math.floor(Math.random() * CONSTANTS.NUM_CELLS) * CONSTANTS.CELL_SIZE + CONSTANTS.CELL_SIZE / 2
    }

    canAttack(o: GameObject): boolean {
        // TODO: properly whcih when squares intersect
        let quadrance = (this.x - o.x) * (this.x - o.x) + (this.y - o.y) * (this.y - o.y)
        return quadrance <= 2 * CONSTANTS.PLAYER_RADIUS * CONSTANTS.PLAYER_RADIUS
    }
}

// why is js/ts so stupid
export function copyGameObject(gameObject : GameObject) {
    let output : GameObject = new GameObject()
    output.x = gameObject.x
    output.y = gameObject.y
    return output
}
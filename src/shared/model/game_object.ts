import * as CONSTANTS from "./../constants"

export class GameObject {
  public x : number
  public y : number

  constructor() {
    // TODO: something better than random, avoid other game objects
    this.x = Math.random() * CONSTANTS.MAP_SIZE
    this.y = Math.random() * CONSTANTS.MAP_SIZE
  }

  canAttack(o : GameObject) : boolean {
    // TODO: properly whcih when squares intersect
    let quadrance = (this.x - o.x) * (this.x - o.x) + (this.y - o.y) * (this.y - o.y)
    return quadrance <= 2 * CONSTANTS.PLAYER_RADIUS * CONSTANTS.PLAYER_RADIUS
  }
}
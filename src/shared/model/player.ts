import * as CONSTANTS from "./../constants"
import { GameObject } from "./game_object"

export class Player extends GameObject {
  public id: string
  public name!: string
  public team: number
  public score: number

  public x : number
  public y : number
  public direction : number

  constructor(id : string, name: string) {
    super()

    this.id = id
    this.name = name
    // TODO: something better than random, try balancing teams
    this.team = Math.floor(Math.random() * CONSTANTS.NUM_TEAMS)
    this.score = 0
    this.direction = 0
  }

  increment() {
    this.score++
    this.team = (this.team + 1) % CONSTANTS.NUM_TEAMS
  }

  canCapture(p : Player) : boolean {
    return (p.team == (this.team + 1) % CONSTANTS.NUM_TEAMS);
  }

  hasCapture(p : Player): boolean {
    return this.canCapture(p) && this.canAttack(p)
  }

  progress(time_step : number) {
    let distance = CONSTANTS.PLAYER_SPEED * time_step
    this.x += Math.sin(this.direction) * distance
    this.y -= Math.cos(this.direction) * distance
    this.clamp()
  }

  clamp() {
    this.x = Math.max(CONSTANTS.PLAYER_RADIUS, Math.min(this.x, CONSTANTS.MAP_SIZE - CONSTANTS.PLAYER_RADIUS))
    this.y = Math.max(CONSTANTS.PLAYER_RADIUS, Math.min(this.y, CONSTANTS.MAP_SIZE - CONSTANTS.PLAYER_RADIUS))
  }

  getColour(me : Player) {
    if (me.canCapture(this)) {
      return CONSTANTS.PREY_COLOUR
    }
    else if (this.canCapture(me)) {
      return CONSTANTS.ENEMY_COLOUR
    }
    else {
      return CONSTANTS.TEAMMATE_COLOUR
    }
  }
}

// why is js/ts so stupid
export function copyPlayer(player : Player) {
  let output : Player = new Player(player.id, player.name)
  output.team = player.team
  output.score = player.score
  output.x = player.x
  output.y = player.y
  output.direction = player.direction
  return output
}

export function interpolatePlayer(player1 : Player, player2 : Player, percentage1 : number, percentage2 : number) {
  let newPlayer : Player = copyPlayer(player1)
  newPlayer.x = player1.x * percentage1 + player2.x * percentage2
  newPlayer.y = player1.y * percentage1 + player2.y * percentage2
  newPlayer.direction = interpolateAngle(player1.direction, player2.direction, percentage1, percentage2)
  newPlayer.clamp()
  return newPlayer
}

function interpolateAngle(direction1 : number, direction2 : number, percentage1 : number, percentage2 : number) {
  if (direction1 - direction2 >= Math.PI) {
    return direction1 * percentage1 + (direction2 + 2 * Math.PI) * percentage2
  }
  else if (direction2 - direction1 >= Math.PI) {
    return direction1 * percentage1 + (direction2 - 2 * Math.PI) * percentage2
  }
  else {
    return direction1 * percentage1 + direction2 * percentage2
  }
}
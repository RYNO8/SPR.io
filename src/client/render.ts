import { debounce } from "throttle-debounce"
import { socket } from "./networking"
import { GameState, importState, interpolate } from "../shared/model/gamestate"
import * as CONSTANTS from "../shared/constants"
import { Player, getColour } from "../shared/model/player"
import { direction } from "./send"
//import { getAsset } from "./assets"

let gamestates : GameState[] = []
let initTimeDiff : boolean = true
let timeDiff : number
socket.on(CONSTANTS.ENDPOINT_UPDATE_GAME_STATE, function(jsonstate : string) {
  let gamestate : GameState = importState(jsonstate)
  if (initTimeDiff) {
    timeDiff = gamestate.time - Date.now()
    initTimeDiff = false
  }
  gamestates.push(gamestate)

  while (gamestates.length > 1 && gamestates[1].time <= Date.now() + timeDiff - CONSTANTS.RENDER_DELAY) {
    // pop the 0th item
    gamestates.shift()
  }
})

const canvas = <HTMLCanvasElement> document.getElementById('game-canvas')
const context : CanvasRenderingContext2D = canvas.getContext('2d')
context.font = CONSTANTS.CANVAS_FONT
context.save()
setCanvasDimensions()

let animationFrameRequestId : number

// Replaces main menu rendering with game rendering.
export function startRendering() {
  cancelAnimationFrame(animationFrameRequestId)
  animationFrameRequestId = requestAnimationFrame(render)
}

function setCanvasDimensions() {
  // On small screens (e.g. phones), we want to "zoom out" so players can still see at least
  // 800 in-game units of width.
  const scaleRatio = Math.max(1, 800 / window.innerWidth)
  canvas.width = scaleRatio * window.innerWidth
  canvas.height = scaleRatio * window.innerHeight
}
window.addEventListener('resize', debounce(40, setCanvasDimensions))


function render() {
  let gamestate : GameState
  if (gamestates.length == 0) {
    // Rerun this render function on the next frame
    animationFrameRequestId = requestAnimationFrame(render)
    return
  }
  else if (gamestates.length == 1) {
    gamestate = gamestates[0]
  }
  else {
    gamestate = interpolate(gamestates[0], gamestates[1], Date.now() + timeDiff - CONSTANTS.RENDER_DELAY)
  }

  updateLeaderboard(gamestates[gamestates.length - 1])

  context.restore()
  context.save()
  renderBackground()

  let me : Player = gamestate.getPlayer(socket.id)
  if (me) {
    document.getElementById("menu").style.visibility = "hidden"

    let scaleFactor : number = Math.min(canvas.width, canvas.height) / (CONSTANTS.MAP_SIZE * CONSTANTS.VISIBLE_REGION)
    context.translate(canvas.width / 2, canvas.height / 2)
    context.scale(scaleFactor, scaleFactor)
    context.translate(-me.x, -me.y)

    // Draw background
    renderMap()

    // Draw all players
    gamestate.getPlayers().forEach(function(other : Player) {
      if (other.id != me.id) {
        renderPlayer(other, getColour(other, me))
      }
    })

    // Draw myself
    console.log(direction)
    me.direction = direction
    renderPlayer(me, CONSTANTS.TEAMMATE_COLOUR)
  }
  
  else {
    document.getElementById("menu").style.visibility = "visible"
    
    //console.log(me, socket.id, gamestate.players)
    let size : number = Math.min(canvas.width, canvas.height)
    context.translate((canvas.width - size) / 2, (canvas.height - size) / 2)
    context.scale(size / CONSTANTS.MAP_SIZE, size / CONSTANTS.MAP_SIZE)
    // Draw background
    renderMap()

    
    // game has ended, render everything
    // Draw all players
    gamestate.getPlayers().forEach(function(other : Player) {
      renderPlayer(other, CONSTANTS.TEAMMATE_COLOUR)
    })
  }

  // Rerun this render function on the next frame
  animationFrameRequestId = requestAnimationFrame(render)
}

function renderBackground() {
  // clear all from previous render
  context.clearRect(0, 0, canvas.width, canvas.height)

  // unreachable
  context.fillStyle = CONSTANTS.MAP_UNREACHABLE_COLOUR
  context.fillRect(0, 0, canvas.width, canvas.height)
}

function renderMap() {
  // boundaries
  context.fillStyle = CONSTANTS.MAP_BACKGROUND_COLOUR
  context.strokeStyle = CONSTANTS.MAP_LINE_COLOUR
  context.lineWidth = CONSTANTS.MAP_LINE_WIDTH
  context.beginPath()
  context.rect(0, 0, CONSTANTS.MAP_SIZE, CONSTANTS.MAP_SIZE)
  context.fill()
  context.stroke()

  // grid
  for (let x = 0; x <= CONSTANTS.MAP_SIZE; x += CONSTANTS.MAP_GRID) {
    context.strokeStyle = CONSTANTS.MAP_LINE_COLOUR
    context.lineWidth = CONSTANTS.MAP_LINE_WIDTH
    context.beginPath()
    context.moveTo(x, 0)
    context.lineTo(x, CONSTANTS.MAP_SIZE)
    context.stroke()
  }
  for (let y = 0; y <= CONSTANTS.MAP_SIZE; y += CONSTANTS.MAP_GRID) {
    context.strokeStyle = CONSTANTS.MAP_LINE_COLOUR
    context.lineWidth = CONSTANTS.MAP_LINE_WIDTH
    context.beginPath()
    context.moveTo(0, y)
    context.lineTo(CONSTANTS.MAP_SIZE, y)
    context.stroke()
  }
  
  // dots
  /*for (let x = CONSTANTS.MAP_GRID; x < CONSTANTS.MAP_SIZE; x += CONSTANTS.MAP_GRID) {
    for (let y = CONSTANTS.MAP_GRID; y < CONSTANTS.MAP_SIZE; y += CONSTANTS.MAP_GRID) {
      context.fillStyle = CONSTANTS.MAP_COLOUR
      context.fillRect(x - 2, y - 2, 4, 4)
    }
  }*/
}


// Renders a ship at the given coordinates
function renderPlayer(player : Player, colour : string) {
  context.save()

  context.translate(player.x, player.y)
  context.rotate(player.direction)
  context.fillStyle = CONSTANTS.PLAYER_COLOUR
  context.strokeStyle = colour
  context.lineWidth = CONSTANTS.PLAYER_LINE_WIDTH

  // Draw ship
  context.beginPath()
  context.rect(-CONSTANTS.PLAYER_RADIUS, -CONSTANTS.PLAYER_RADIUS, 2 * CONSTANTS.PLAYER_RADIUS, 2 * CONSTANTS.PLAYER_RADIUS)
  context.fill()
  context.stroke()

  // Draw text
  context.rotate(-player.direction)
  context.fillStyle = CONSTANTS.PLAYER_COLOUR
  context.font = CONSTANTS.CANVAS_FONT
  context.textAlign = "center"
  context.fillText(player.name, 0, CONSTANTS.NAME_OFFSET)

  context.restore()
}

function updateLeaderboard(gamestate : GameState) {
  let sortedPlayers : Player[] = Object.values(gamestate.players).sort(function(p1 : Player, p2 : Player) {
    if (p1.score > p2.score) {
      return 1
    }
    else if (p1.score < p2.score) {
      return -1
    }
    else {
      return 0
    }
  })

  let table = document.querySelector("#leaderboard > table > tbody")
  table.innerHTML = ""
  sortedPlayers.map(function(p : Player, i : number) {
    let rank = document.createElement("td")
    rank.innerHTML = "#" + (i + 1).toString()

    let name = document.createElement("td")
    name.innerHTML = p.name

    let score = document.createElement("td")
    score.innerHTML = p.score.toString()

    let row = document.createElement("tr")
    row.appendChild(rank)
    row.appendChild(name)
    row.appendChild(score)
    
    table.appendChild(row)
  })
}

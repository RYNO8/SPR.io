// NOTE: all times are in milliseconds, all distances are in pixels

// networking
export const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 80
export const CLIENT_SEND_RATE: number = 40
export const SERVER_BOT_UPDATE_RATE: number = 40
export const SERVER_UPDATE_RATE: number = 10 // duration between each gamestate.update()
export const SERVER_TICK_RATE: number = 30 // duration between each packet send
export const RENDER_DELAY: number = 100
export const SAMPLE_SIZE: number = 20

// socketio "endpoints"
export enum Endpoint {
    CLIENT_CONNECT = "connect",
    CLIENT_DISCONNECT = "disconnect",
    SERVER_CONNECT = "connection",
    SERVER_DISCONNECT = "disconnect",
    UPDATE_DIRECTION = "update_direction",
    UPDATE_SPEED = "update_speed",
    REQUEST_GAME_STATE = "request_game_state",
    UPDATE_GAME_STATE = "update_game",
    UPDATE_LEADERBOARD = "update_leaderboard",
    RESET = "reset",
    GAME_INIT = "game_init",
    GAME_OVER = "game_over",
}


// misc
export const NUM_TEAMS: number = 3
export const VISIBLE_WIDTH: number = 1500
export const VISIBLE_HEIGHT: number = 1500
export const VISIBLE_BUFFER: number = 150 // >= 0
export const CANVAS_FONT: string = "bold 20px arial"
export const INTERPOLATE_SPEED: number = 5 // depends on SERVER_TICK_RATE
export const NAME_PLACEHOLDER: string = "Duck!"
export const EPSILON: number = 5e-4
export const MAX_TIMESTAMP: number = 8640000000000000

// room management
export const ROOM_THRESHOLD = 2
export const ROOM_MAX = 4

// leaderboard
export const LEADERBOARD_UPDATE_RATE: number = 0.5 * 1000
export const LEADERBOARD_LEN: number = 5

// player
export const PLAYER_RADIUS: number = 35
export const PLAYER_SPEED: number = 0.36
export const PLAYER_LINE_WIDTH: number = 7
export const PLAYER_NAME_OFFSET: number = 55
export const PLAYER_DEFAULT_COLOUR: string = "black"
export const PLAYER_POWERUP_COLOUR: string = "purple"
export const PLAYER_PREY_COLOUR: string = "#1D7755" // green
export const PLAYER_ENEMY_COLOUR: string = "#DB423D" // red
export const PLAYER_TEAMMATE_COLOUR: string = "#60ACBC" // blue // NOTE: this is also your colour, since you are your own teammate

// bots
export const BOTS_MAX: number = 2
export const BOT_SPAWN_RATE: number = 0 //0.3 / 1000
// assuming all names pass the utilities.validName() check
export const BOT_NAMES = [
    "Inky",
    "Pinky",
    "Clyde",
    "Daniel"
]

// powerup
export const POWERUP_RATE: number = 0.1 / 1000 // must be between 0 and 1 inclusive, expected number of powerups per ms
export const POWERUP_MAX: number = 100
export const POWERUP_DURATION: number = 10 * 1000
export const POWERUP_RADIUS = 14
export const POWERUP_OMEGA = 0.8 / 1000 * (2 * Math.PI)

// map
export const MAP_SIZE: number = 7200
export const MAP_LINE_WIDTH: number = 2
export const MAP_SHADOW_WIDTH = 15
export const MAP_STYLE: string = "none" // or "none" or "grid"
export const MAP_LINE_COLOUR: string = "black"
export const MAP_UNREACHABLE_COLOUR: string = "#37782C"
export const MAP_SHADOW_COLOUR_1 = "#9FD983"
export const MAP_SHADOW_COLOUR_2 = "#64BB6A"
export const MAP_WATER_COLOUR = { h: 186, s: .69, v: .75 } // also in css body

// ripple effects
export const RIPPLE_TRUE_WIDTH = 25 * 16 //400
export const RIPPLE_TRUE_HEIGHT = 25 * 9 //225
export const RIPPLE_BORDER_SIZE = 20
export const RIPPLE_WIDTH = RIPPLE_TRUE_WIDTH + 2 * RIPPLE_BORDER_SIZE // 440
export const RIPPLE_HEIGHT = RIPPLE_TRUE_HEIGHT + 2 * RIPPLE_BORDER_SIZE // 265
export const RIPPLE_DAMPENING = 0.97 // scalar between 0 and 1 inclusive
export const RIPPLE_PEN_COLOUR = 255 // integer between 0 and 255 inclusive
export const RIPPLE_PLAYER_SIZE = 0.015
export const RIPPLE_BUBBLE_SIZE = 0.005
export const RIPPLE_GRADIENT_SIZE = 1 //0.5
export const RIPPLE_REDRAW_DIST = 10
export const RIPPLE_BUBBLE_RATE = 1.2 / 1000

// maze
export const CELL_SIZE: number = 180 // there is a grid line every this many pixels
export const NUM_CELLS: number = MAP_SIZE / CELL_SIZE
export const MAZE_CHANGE_RATE: number = 7 / 1000 // should scale up linearly with CELL_SIZE*CELL_SIZE
export const MAZE_WALL_SMOOTHNESS: number = 0.3 // must be between 0 and 1 inclusive
export const MAZE_OVERLAP: number = 15 // how "puffy" obstacles are
export const MAZE_CHANGE_DELAY: number = 2 * 1000
export const MAZE_NAME: string = "the Labyrinth."
// magic values for cellular automata (dont change!)
export const MAZE_DENSITY: number = 0.48 // must be between 0 and 1 inclusive, what percentage of the maze is walls
export const CA_DEATH_LIMIT = 2
export const CA_BIRTH_LIMIT = 4
export const CA_NUM_STEPS = 3
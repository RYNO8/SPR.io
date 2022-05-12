// NOTE: all times are in milliseconds, all distances are in pixels

export let PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 80

// networking
export let SERVER_BOT_UPDATE_RATE: number = 40
export let SERVER_UPDATE_RATE: number = 10 // duration between each gamestate.update()
export let SERVER_TICK_RATE: number = 40 // duration between each packet send
export let RENDER_DELAY: number = 60
export let SAMPLE_SIZE: number = 6

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
export let NUM_TEAMS: number = 3
export let VISIBLE_WIDTH: number = 1500
export let VISIBLE_HEIGHT: number = 1500
export let VISIBLE_BUFFER: number = 200 // >= 0
export let CANVAS_FONT: string = "20px serif"
export let INTERPOLATE_SPEED: number = 5 // depends on SERVER_TICK_RATE
export let LEADERBOARD_UPDATE_RATE: number = 0.5 * 1000
export let NAME_PLACEHOLDER: string = "Placeholder"
export let EPSILON: number = 5e-4

// player
export let PLAYER_RADIUS: number = 35
export let PLAYER_SPEED: number = 0.36
export let PLAYER_LINE_WIDTH: number = 7
export let PLAYER_NAME_OFFSET: number = 55
export let PLAYER_DEFAULT_COLOUR: string = "black"
export let PLAYER_POWERUP_COLOUR: string = "purple"
export let PLAYER_PREY_COLOUR: string = "#1D7755" // green
export let PLAYER_ENEMY_COLOUR: string = "#DB423D" // red
export let PLAYER_TEAMMATE_COLOUR: string = "#60ACBC" // blue // NOTE: this is also your colour, since you are your own teammate

// bots
export let BOTS_MAX: number = 2
export let BOT_SPAWN_RATE: number = 0 //0.3 / 1000
// assuming all names pass the utilities.validName() check
export const BOT_NAMES = [
    "Inky",
    "Pinky",
    "Clyde",
    "Daniel"
]

// powerup
export let POWERUP_RATE: number = 0 //0.1 / 1000 // must be between 0 and 1 inclusive, expected number of powerups per ms
export let POWERUP_MAX: number = 100
export let POWERUP_DURATION: number = 5 * 1000
export let POWERUP_RADIUS = 14
export let POWERUP_COLOUR = "purple"

// map
export let MAP_SIZE: number = 1800 //7200
export let MAP_LINE_WIDTH: number = 2
export let MAP_SHADOW_WIDTH = 10
export let MAP_STYLE: string = "dots" // or "none" or "grid"
export let MAP_LINE_COLOUR: string = "black"
export let MAP_BACKGROUND_COLOUR: string = "white"
export let MAP_UNREACHABLE_COLOUR: string = "grey"
export let MAP_SHADOW_COLOUR = "lightgrey"
export let MAP_WARNING_COLOUR = "rgba(255, 0, 0, 0.7)"

// maze
export let CELL_SIZE: number = 180 // there is a grid line every this many pixels
export let NUM_CELLS: number = MAP_SIZE / CELL_SIZE
export let MAZE_CHANGE_RATE: number = 2.5 / 1000 // should scale up linearly with CELL_SIZE*CELL_SIZE
export let MAZE_WALL_SMOOTHNESS: number = 0.3 // must be between 0 and 1 inclusive
export let MAZE_OVERLAP: number = 15
export let MAZE_CHANGE_DELAY: number = 2000
export let MAZE_NAME: string = "the Labyrinth."
// magic values for cellular autonoma (dont change!)
export let MAZE_DENSITY: number = 0.48 // must be between 0 and 1 inclusive, what percentage of the maze is walls
export let CA_DEATH_LIMIT = 2
export let CA_BIRTH_LIMIT = 4
export let CA_NUM_STEPS = 3
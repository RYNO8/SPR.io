// NOTE: all times are in milliseconds, all distances are in pixels

export let PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 80

// networking
export let SERVER_BOT_UPDATE_RATE: number = 1000 / 4
export let SERVER_UPDATE_RATE: number = 10 // duration between each gamestate.update()
export let SERVER_TICK_RATE: number = 40 // duration between each packet send
export let RENDER_DELAY: number = 60
export let SAMPLE_SIZE: number = 6

// socketio "endpoints"
// TODO: enum, might break the bot
export let ENDPOINT_CLIENT_CONNECT: string = "connect"
export let ENDPOINT_CLIENT_DISCONNECT: string = "disconnect"
export let ENDPOINT_SERVER_CONNECT: string = "connection"
export let ENDPOINT_SERVER_DISCONNECT: string = "disconnect"
export let ENDPOINT_UPDATE_DIRECTION: string = "update_direction"
export let ENDPOINT_UPDATE_SPEED: string = "update_speed"
export let ENDPOINT_REQUEST_GAME_STATE: string = "request_game_state"
export let ENDPOINT_UPDATE_GAME_STATE: string = "update_game"
export let ENDPOINT_UPDATE_LEADERBOARD: string = "update_leaderboard"
export let ENDPOINT_RESET: string = "reset"
export let ENDPOINT_GAME_INIT: string = "game_init"
export let ENDPOINT_GAME_OVER: string = "game_over"

// misc
export let NUM_TEAMS: number = 3
export let VISIBLE_WIDTH: number = 1500
export let VISIBLE_HEIGHT: number = 1500
export let VISIBLE_BUFFER: number = 200 // >= 0
export let CANVAS_FONT: string = "20px serif"
export let INTERPOLATE_SPEED: number = 5 // depends on SERVER_TICK_RATE
export let LEADERBOARD_UPDATE_RATE: number = 0.5 * 1000
export let NAME_PLACEHOLDER: string = "Placeholder"
export let EPSILON: number = 1e-5

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
export let BOTS_MAX: number = 1;
export let BOT_SPAWN_RATE: number = 1//0.3 / 1000
// assuming all names pass the utilities.validName() check
export const BOT_NAMES = [
    "Inky",
    "Pinky",
    "Clyde",
    "Daniel"
]

// powerup
export let POWERUP_RATE: number = 0.1 / 1000 // must be between 0 and 1 inclusive, expected number of powerups per ms
export let POWERUP_MAX: number = 100
export let POWERUP_DURATION: number = 5 * 1000
export let POWERUP_RADIUS = 14
export let POWERUP_COLOUR = "purple"

// map
export let MAP_SIZE: number = 1800 //6300
export let MAP_LINE_COLOUR: string = "black"
export let MAP_BACKGROUND_COLOUR: string = "white"
export let MAP_UNREACHABLE_COLOUR: string = "grey"
export let MAP_LINE_WIDTH: number = 2
export let MAP_STYLE: string = "dots" // or "none" or "grid"
export let MAP_SHADOW_COLOUR = "lightgrey"
export let MAP_SHADOW_WIDTH = 20 // >= 2

// maze
export let CELL_SIZE: number = 90 // there is a grid line every this many pixels
export let NUM_CELLS: number = MAP_SIZE / CELL_SIZE
export let MAZE_DENSITY: number = 0.1 // must be between 0 and 1 inclusive
export let MAZE_CHANGE_RATE: number = 0 //0.1 / 1000
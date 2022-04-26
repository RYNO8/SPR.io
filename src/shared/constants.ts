// NOTE: all times are in milliseconds, all distances are in pixels

export let PORT: number = 80

// networking
export let SERVER_TICK_RATE: number = 50 / 1000
export let SERVER_TIMESTEP = 1 / SERVER_TICK_RATE
export let RENDER_DELAY: number = 50
export let CLIENT_FRAME_RATE_SAMPLE_SIZE: number = 20

// socketio "endpoints"
export let ENDPOINT_CLIENT_CONNECT: string = "connect"
export let ENDPOINT_CLIENT_DISCONNECT: string = "disconnect"
export let ENDPOINT_SERVER_CONNECT: string = "connection"
export let ENDPOINT_SERVER_DISCONNECT: string = "disconnect"
export let ENDPOINT_UPDATE_DIRECTION: string = "update_direction"
//export let ENDPOINT_UPDATE_SPEED: string = "update_speed"
export let ENDPOINT_UPDATE_GAME_STATE: string = "update_game"
export let ENDPOINT_GAME_INIT: string = "game_init"

// misc
export let NUM_TEAMS: number = 3
export let VISIBLE_REGION: number = 0.4 // players can see a square region of 0.4*MAP_SIZE
export let CANVAS_FONT: string = "20px serif"

// player
export let PLAYER_RADIUS: number = 35
export let PLAYER_SPEED: number = 0.6
export let PLAYER_LINE_WIDTH: number = 6
export let PLAYER_NAME_OFFSET: number = 50
export let PLAYER_DEFAULT_COLOUR: string = "black"
export let PLAYER_POWERUP_COLOUR: string = "purple"
export let PLAYER_PREY_COLOUR: string = "#1D7755" // green
export let PLAYER_ENEMY_COLOUR: string = "#DB423D" // red
export let PLAYER_TEAMMATE_COLOUR: string = "#60ACBC" // blue // NOTE: this is also your colour, since you are your own teammate

// powerup
export let POWERUP_RATE: number = 0.1 / 1000 // must be between 0 and 1 inclusive
export let POWERUP_MAX: number = 10
export let POWERUP_DURATION: number = 2000
export let POWERUP_RADIUS = 14
export let POWERUP_COLOUR = "purple"

// map
export let MAP_SIZE: number = 3000
export let MAP_LINE_COLOUR: string = "lightgrey"
export let MAP_BACKGROUND_COLOUR: string = "white"
export let MAP_UNREACHABLE_COLOUR: string = "lightgrey"
export let MAP_LINE_WIDTH: number = 2
export let MAP_STYLE: string = "grid" // or "dots" or "none"

// maze
export let CELL_SIZE: number = 150 // there is a grid line every this many pixels
export let NUM_CELLS: number = MAP_SIZE / CELL_SIZE
export let MAZE_DENSITY: number = 0.2
export let MAZE_CHANGE_RATE: number = 0.1 / 1000
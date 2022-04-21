export let PORT : number = 80

// networking
// in frames per second
export let SERVER_TICK_RATE : number = 30
// in milliseconds
export let SERVER_TIME_STEP = 1000 / SERVER_TICK_RATE
// in milliseconds
export let RENDER_DELAY : number = 100

// socketio "endpoints"
export let ENDPOINT_CLIENT_CONNECT : string = "connect"
export let ENDPOINT_CLIENT_DISCONNECT : string = "disconnect"
export let ENDPOINT_SERVER_CONNECT : string = "connection"
export let ENDPOINT_SERVER_DISCONNECT : string = "disconnect"
export let ENDPOINT_UPDATE_DIRECTION : string = "update_direction"
//export let ENDPOINT_UPDATE_SPEED : string = "update_speed"
export let ENDPOINT_UPDATE_GAME_STATE : string = "update_game"
export let ENDPOINT_GAME_INIT : string = "game_init"

// game mechanics
export let NUM_TEAMS : number = 3
export let PLAYER_RADIUS : number = 35
export let PLAYER_SPEED : number = 0.25
export let MAP_SIZE : number = 1000
export let VISIBLE_REGION : number = 0.4 // players can see a square region of 0.4*MAP_SIZE
export let POWERUP_RATE : number = 0.1 / 1000 // rate of powerups per millisecond, must be between 0 and 1 inclusive

// display
export let CANVAS_FONT : string = "20px serif"
export let NAME_OFFSET : number = 40
export let PREY_COLOUR : string = "#1D7755" // green
export let ENEMY_COLOUR : string = "#DB423D" // red
export let TEAMMATE_COLOUR : string = "#60ACBC" // blue // NOTE: this is also your colour, since you are your own teammate
export let PLAYER_LINE_WIDTH : number = 6
export let PLAYER_COLOUR : string = "black"
export let MAP_LINE_COLOUR : string = "lightgrey"
export let MAP_BACKGROUND_COLOUR : string = "white"
export let MAP_UNREACHABLE_COLOUR : string = "lightgrey"
export let MAP_LINE_WIDTH : number = 2
export let MAP_GRID : number = 375 // there is a grid line every 10 units, this must be a divisor of MAP_SIZE
import { GameObject } from "../model/game_object";
import { Player } from "../model/player";
import { Powerup } from "../model/powerup";
import { Maze } from "../model/maze";
import { ServerGameState } from "../model/gamestate";
import { CELL_SIZE } from "../constants";
import { VIEW_GRID_RADIUS } from "./ai_constants";

const checkTileForEntities = (x: number, y: number, entities: GameObject[]) => {
    for (const entity of entities) {
        if (
            Math.floor(entity.centroid.x / CELL_SIZE) === x &&
            Math.floor(entity.centroid.y / CELL_SIZE) === y
        ) {
            return true;
        }
    }
    return false;
};

export const generateInputs = (
    me: Player,
    state: ServerGameState
): number[] => {
    const meX = Math.floor(me.centroid.x / CELL_SIZE);
    const meY = Math.floor(me.centroid.y / CELL_SIZE);

    const inputs = [];

    for (let y = meY - VIEW_GRID_RADIUS; y <= meY + VIEW_GRID_RADIUS; y++) {
        for (let x = meX - VIEW_GRID_RADIUS; x <= meX + VIEW_GRID_RADIUS; x++) {
            inputs.push(state.maze.getCell(x, y) ? 1 : 0);
            inputs.push(checkTileForEntities(x, y, state.powerups) ? 1 : 0);
            inputs.push(checkTileForEntities(x,y, state.getPlayers().filter(p => me.canCapture(p))) ? 1 : 0);
            inputs.push(checkTileForEntities(x,y, state.getPlayers().filter(p => p.canCapture(me))) ? 1 : 0);
        }
    }

    return inputs;
};

// return your new player direction, as a number in the range (-Pi, Pi]
// return NaN if you feel like it
// dont modify any variables
// you can call any method of gamestate, player, powerup and obstacle that doesnt modify any variables
// try not to make this function too expensive, its being called for each bot every "SERVER_UPDATE_RATE" milliseconds
export function findBotDirection(
    me: Player,
    gamestate: ServerGameState
): number {
    //TODO

    return me.direction + 0.1;
}

import { GameObject } from "../model/game_object";
import { Player } from "../model/player";
import { Powerup } from "../model/powerup";
import { Maze } from "../model/maze";
import { ServerGameState } from "../model/server_gamestate";

const headTowards = (me: Player, them: GameObject) => {
    return Math.atan2(them.centroid.y - me.centroid.y, them.centroid.x - me.centroid.x);
};

const findClosest = (me: Player, targets: GameObject[]) => {
    let shortest_dist = Number.MAX_VALUE;
    let closest = null;

    for (const t of targets) {
        // you can use sub(me, t).dist() from position.ts
        const dx = t.centroid.x - me.centroid.x;
        const dy = t.centroid.y - me.centroid.y;
        const dist = dx ** 2 + dy ** 2;
        if (dist < shortest_dist) {
            shortest_dist = dist;
            closest = t;
        }
    }

    return closest;
};

// return your new player direction, as a number in the range (-Pi, Pi]
// return NaN if you feel like it
// dont modify any variables
// you can call any method of gamestate, player, powerup and obstacle that doesnt modify any variables
// try not to make this function too expensive, its being called for each bot every "SERVER_UPDATE_RATE" milliseconds
export function findBotDirection(me: Player, gamestate: ServerGameState): number {
    let direction = me.direction
    direction += 0.1

    const targetPlayers = gamestate.getPlayers().filter((p: Player) => me.canCapture(p));
    const targets: GameObject[] = [...targetPlayers, ...gamestate.powerups];

    const target = findClosest(me, targets);
    if (target !== null) {
        direction = headTowards(me, target);
    }

    return direction
}

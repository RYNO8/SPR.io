import { GameObject } from "../model/game_object";
import { Player } from "../model/player";

export const headTowards = (me: Player, them: GameObject) => {
    return Math.atan2(them.y - me.y, them.x - me.x);
};

export const findClosest = (me: Player, targets: GameObject[]) => {
    let shortest_dist = Number.MAX_VALUE;
    let closest = null;

    for (const t of targets) {
        const dx = t.x - me.x;
        const dy = t.y - me.y;
        const dist = dx ** 2 + dy ** 2;
        if (dist < shortest_dist) {
            shortest_dist = dist;
            closest = t;
        }
    }

    return closest;
};

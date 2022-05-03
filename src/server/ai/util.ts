/*import { GameObject } from "../../shared/model/game_object";
import { Player } from "../../shared/model/player";

export const headTowards = (me: Player, them: GameObject) => {
    return Math.atan2(them.centroid.y - me.centroid.y, them.centroid.x - me.centroid.x);
};

export const findClosest = (me: Player, targets: GameObject[]) => {
    let shortest_dist = Number.MAX_VALUE;
    let closest = null;

    for (const t of targets) {
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
*/
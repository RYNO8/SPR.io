import { GameObject } from "../model/game_object";
import { Maze } from "../model/maze";
import { Player } from "../model/player";
import { Powerup } from "../model/powerup";
import { findClosest, headTowards } from "./util";

export class Bot extends Player {
    constructor(id: string, name: string, x: number, y: number) {
        super(id, name, x, y);

        this.isBot = true;
    }

    progress(maze: Maze, otherPlayers: Player[], powerups: Powerup[]): void {
        this.direction += 0.1

        const targetPlayers = otherPlayers.filter(p => this.canCapture(p));
        const targets: GameObject[] = [...targetPlayers, ...powerups];

        const target = findClosest(this, targets);
        if(target !== null) {
            this.direction = headTowards(this, target);
        }

        super.progress(maze, otherPlayers, powerups);
    }
}

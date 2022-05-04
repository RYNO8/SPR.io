import { crossover, mutate } from "./neatJS/NEAT";

export const VIEW_GRID_RADIUS = 3;
export const POPULATION_SIZE = 30;
export const NEAT_CONFIG = {
    model: [
        { nodeCount: (VIEW_GRID_RADIUS * 2 + 1) ** 2 * 4, type: "input" },
        { nodeCount: 1, type: "output", activationfunc: (x: number) => x },
    ],
    mutationRate: 0.05,
    crossoverMethod: crossover.RANDOM,
    mutationMethod: mutate.RANDOM,
    populationSize: POPULATION_SIZE,
};
export const LIFETIME = 40;

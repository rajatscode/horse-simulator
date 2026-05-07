export type GameMode = 'survival' | 'laststand';

export const GAME_MODES = {
  survival: {
    name: 'SURVIVAL',
    description: 'Survive as long as you can in the open world',
    predatorCount: 1,
    moleCount: 3,
  },
  laststand: {
    name: 'LAST STAND',
    description: 'Defend the center location from threats',
    predatorCount: 2,
    moleCount: 3,
  },
};

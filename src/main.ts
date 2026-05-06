import { Game } from './core/Game';

// Start the game
const game = new Game();

// Expose for debugging
(window as any).game = game;

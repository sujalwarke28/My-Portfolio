import { createContext, useContext } from 'react';
import type { Game } from '../game/engine.ts';

/**
 * Gives the interface a handle on the running game.
 *
 * Only a few components need it — the minimap subscribes to the player's
 * position, the map screen calls fast travel, and the touch pad pushes
 * virtual input. Everything else reads the store, which is deliberate: the
 * fewer components that can reach into the engine, the fewer places there
 * are to accidentally cause a render on every frame.
 */
const GameContext = createContext<Game | null>(null);

export const GameProvider = GameContext.Provider;

export function useGame(): Game {
  const game = useContext(GameContext);
  if (!game) throw new Error('useGame() used outside a GameProvider');
  return game;
}

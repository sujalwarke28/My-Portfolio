import { useEffect, useRef } from 'react';
import { bakeMinimap } from '../game/minimap.ts';
import { sceneHeight, sceneWidth } from '../game/scenes.ts';
import { useGameStore } from '../state/useGameStore.ts';
import { useGame } from './GameContext.tsx';

/**
 * The corner minimap: always on screen, in every scene.
 *
 * This component is the one place in the interface that has to track a
 * continuously changing value, and it deliberately does not re-render to do
 * it. The terrain is baked to an offscreen canvas once per scene, and the
 * player's dot is painted imperatively from the engine's position feed,
 * which publishes at 10Hz and only when the player's tile actually changes.
 *
 * Done the obvious way — holding the player's position in the store and
 * reading it here — every HUD element would re-render sixty times a second
 * while walking. Check this with the React DevTools profiler if you ever
 * change it: walking across the town should produce no renders at all.
 */

/** Aim for a map about this many pixels on its longest side. */
const TARGET_PX = 132;

export function Minimap() {
  const game = useGame();
  const sceneId = useGameStore((state) => state.sceneId);
  const setMapOpen = useGameStore((state) => state.setMapOpen);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = game.getScene();
    const longest = Math.max(sceneWidth(scene), sceneHeight(scene));
    const cell = Math.max(2, Math.min(12, Math.floor(TARGET_PX / longest)));
    const baked = bakeMinimap(scene, cell);

    canvas.width = baked.width;
    canvas.height = baked.height;
    canvas.style.width = `${baked.width}px`;
    canvas.style.height = `${baked.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const paint = (tx: number, ty: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(baked, 0, 0);

      // A dark halo under a light dot, so the marker stays visible over
      // both the pale paths and the dark treeline.
      const size = Math.max(3, cell + 1);
      const x = Math.round(tx * cell + cell / 2 - size / 2);
      const y = Math.round(ty * cell + cell / 2 - size / 2);
      ctx.fillStyle = '#10101c';
      ctx.fillRect(x - 1, y - 1, size + 2, size + 2);
      ctx.fillStyle = '#f4f4f8';
      ctx.fillRect(x, y, size, size);
    };

    return game.subscribePosition(paint);
  }, [game, sceneId]);

  return (
    <div className="pointer-events-auto flex flex-col items-start gap-1.5 max-sm:scale-[0.8] max-sm:origin-top-left">
      <button
        type="button"
        onClick={() => setMapOpen(true)}
        className="pixel-frame block p-1.5 transition-transform hover:scale-[1.02]"
        aria-label="Open the full map"
      >
        <canvas ref={canvasRef} />
      </button>
      {/* The caption gets its own plate. Plain text here sits over whatever
          terrain happens to be behind it and becomes unreadable the moment
          the player walks past something pale. */}
      <p className="pixel-frame px-2 py-1 font-pixel text-[8px] leading-none whitespace-nowrap text-paper2">
        Press <span className="text-gold">[M]</span> to open map
      </p>
    </div>
  );
}

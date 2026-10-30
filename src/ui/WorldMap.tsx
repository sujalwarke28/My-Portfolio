import { useEffect, useMemo, useRef, useState } from 'react';
import { bakeMinimap } from '../game/minimap.ts';
import { sceneHeight, sceneWidth } from '../game/scenes.ts';
import { ALL_BADGES, useGameStore } from '../state/useGameStore.ts';
import { useGame } from './GameContext.tsx';
import { useEscapeKey } from './hooks.ts';

/**
 * The full map screen, opened with M.
 *
 * It is the same picture as the corner minimap at a larger cell size, so the
 * two can never disagree. Markers are DOM elements positioned over the
 * canvas in percentages rather than drawn onto it, which gets real buttons —
 * focusable, with accessible names — for the fast-travel targets.
 *
 * Fast travel unlocks per building as its badge is earned. That is not a
 * gate for its own sake: being able to teleport to a building you have never
 * seen would skip the walk, and the walk is the thing.
 */

/**
 * The map is drawn at whatever cell size makes it about this wide, then
 * displayed at its natural pixel size rather than stretched to the panel.
 * Stretching made the canvas tall enough to push the close button off the
 * bottom of the screen, and resampled every pixel on the way.
 */
const TARGET_PX = 480;

function cellFor(tilesW: number, tilesH: number): number {
  return Math.max(6, Math.min(24, Math.floor(TARGET_PX / Math.max(tilesW, tilesH))));
}

export function WorldMap() {
  const game = useGame();
  const setMapOpen = useGameStore((state) => state.setMapOpen);
  const badges = useGameStore((state) => state.badges);
  const sceneName = useGameStore((state) => state.sceneName);
  const close = () => setMapOpen(false);
  useEscapeKey(close);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scene = game.getScene();
  const [playerTile] = useState(() => game.getPlayerTile());

  const dimensions = useMemo(
    () => ({ tilesW: sceneWidth(scene), tilesH: sceneHeight(scene) }),
    [scene],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const baked = bakeMinimap(scene, cellFor(dimensions.tilesW, dimensions.tilesH));
    canvas.width = baked.width;
    canvas.height = baked.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(baked, 0, 0);
  }, [scene, dimensions]);

  const percent = (tile: number, total: number) => `${((tile + 0.5) / total) * 100}%`;
  const earned = ALL_BADGES.filter((badge) => badges[badge]).length;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/85 p-3">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-title"
        className="pixel-panel anim-rise pixel-scroll flex max-h-[94vh] w-full max-w-3xl flex-col overflow-y-auto px-5 py-5"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="font-pixel text-[9px] tracking-[0.2em] text-blue">TOWN MAP</p>
            <h2 id="map-title" className="mt-1.5 font-pixel text-[13px] text-ink">
              {sceneName}
            </h2>
          </div>
          <p className="font-pixel text-[9px] text-ink3">
            BADGES {earned}/{ALL_BADGES.length}
          </p>
        </div>

        {/* The wrapper shrink-wraps the canvas so the percentage-positioned
            markers line up with the map itself rather than with a box that
            is wider than it. */}
        <div className="mt-4 flex justify-center">
          <div className="relative border-[3px] border-ink bg-ink">
            <canvas ref={canvasRef} className="block h-auto max-h-[56vh] w-auto max-w-full" />
            {scene.markers.map((marker) => {
              const locked = marker.badge ? !badges[marker.badge] : false;
              const canTravel = Boolean(marker.travelTo) && !locked;
              return (
                <div
                  key={marker.label}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: percent(marker.tx, dimensions.tilesW),
                    top: percent(marker.ty, dimensions.tilesH),
                  }}
                >
                  <button
                    type="button"
                    disabled={!canTravel}
                    onClick={() => marker.travelTo && game.travelTo(marker.travelTo)}
                    className="flex flex-col items-center gap-1 disabled:cursor-default"
                    aria-label={
                      canTravel
                        ? `Travel to ${marker.label}`
                        : `${marker.label} — not found yet`
                    }
                    title={canTravel ? `Travel to ${marker.label}` : 'Find it on foot first'}
                  >
                    <span
                      className="h-3.5 w-3.5 border-2 border-ink"
                      style={{
                        background: locked ? 'rgba(244,244,248,0.3)' : marker.color,
                      }}
                    />
                    <span
                      className="whitespace-nowrap border-2 border-ink px-1.5 py-0.5 font-pixel text-[7px] leading-none"
                      style={{
                        background: '#10101c',
                        color: locked ? '#7b7b96' : '#f4f4f8',
                      }}
                    >
                      {locked ? '???' : marker.label}
                    </span>
                  </button>
                </div>
              );
            })}

            {/* The player's position, frozen at the moment the map opened —
                the world is paused while this is up, so it cannot go stale. */}
            <span
              className="anim-blink absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 border-2 border-ink bg-paper"
              style={{
                left: percent(playerTile[0], dimensions.tilesW),
                top: percent(playerTile[1], dimensions.tilesH),
              }}
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="flex items-center gap-2 font-pixel text-[8px] text-ink2">
            <span className="h-3 w-3 border-2 border-ink bg-paper" /> YOU ARE HERE
          </span>
          <span className="flex items-center gap-2 font-pixel text-[8px] text-ink2">
            <span className="h-3 w-3 border-2 border-ink bg-gold" /> VISITED — CLICK TO TRAVEL
          </span>
          <span className="flex items-center gap-2 font-pixel text-[8px] text-ink3">
            <span className="h-3 w-3 border-2 border-ink bg-paper3" /> ??? — GO THERE ON FOOT
          </span>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-ink3">
          Click a building you have already visited to travel there. Press{' '}
          <span className="font-pixel text-[9px] text-blue">M</span> or{' '}
          <span className="font-pixel text-[9px] text-blue">ESC</span> to close.
        </p>

        <div className="mt-4 flex justify-end">
          <button type="button" onClick={close} className="pixel-btn px-6 py-2.5 text-[11px]">
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

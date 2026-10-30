import { useState } from 'react';
import { useGameStore } from '../state/useGameStore.ts';

/**
 * The controls legend, always on screen.
 *
 * It fades while the player is walking and comes back when they stop or
 * hover it. That behaviour is the compromise that lets it be *always*
 * visible without being in the way: a permanently opaque panel in the
 * corner of a small viewport covers a chunk of the world you are walking
 * into, and one that disappears entirely is not a legend.
 */

const KEYS: Array<{ keys: string; action: string }> = [
  { keys: 'W A S D', action: 'Walk' },
  { keys: '← ↑ ↓ →', action: 'Walk' },
  { keys: 'Shift', action: 'Run' },
  { keys: 'E / Enter', action: 'Interact' },
  { keys: 'M', action: 'Map' },
  { keys: 'H', action: 'Help' },
  { keys: 'Esc', action: 'Close' },
  { keys: 'Click', action: 'Walk there' },
];

/**
 * On a touch device the D-pad on screen already shows the movement and
 * action buttons, so the legend only needs to cover what a finger cannot
 * discover by looking at it.
 */
const TOUCH_KEYS: Array<{ keys: string; action: string }> = [
  { keys: 'D-pad', action: 'Walk' },
  { keys: 'E', action: 'Interact' },
  { keys: 'M', action: 'Map' },
  { keys: 'Tap ground', action: 'Walk there' },
];

export function Legend({ compact = false }: { compact?: boolean }) {
  const walking = useGameStore((state) => state.walking);
  const [hovered, setHovered] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const rows = compact ? TOUCH_KEYS : KEYS;

  const dimmed = walking && !hovered;

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="pixel-frame pointer-events-auto px-3 py-2 font-pixel text-[9px] text-paper2"
        aria-label="Show the controls legend"
      >
        KEYS
      </button>
    );
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="pixel-frame pointer-events-auto px-3 py-2.5 transition-opacity duration-200"
      style={{ opacity: dimmed ? 0.34 : 1 }}
      aria-label="Controls"
    >
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="font-pixel text-[8px] tracking-[0.2em] text-gold">CONTROLS</span>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="font-pixel text-[8px] text-paper3 hover:text-paper"
          aria-label="Hide the controls legend"
        >
          ×
        </button>
      </div>
      <dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-1">
        {rows.map((entry) => (
          <div key={`${entry.keys}-${entry.action}`} className="col-span-2 grid grid-cols-subgrid">
            <dt className="font-pixel text-[8px] whitespace-nowrap text-blue-light">
              {entry.keys}
            </dt>
            <dd className="font-pixel text-[8px] whitespace-nowrap text-paper2">{entry.action}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

import { useEffect, useRef, type ReactNode } from 'react';
import { useGameStore } from '../../state/useGameStore.ts';
import { useEscapeKey } from '../hooks.ts';

/**
 * Shared chrome for the building interiors.
 *
 * All four sections are text-heavy, link-heavy and scrollable, which is
 * exactly what the DOM is good at and what canvas is bad at — selectable
 * text, real anchors, working scrollbars and screen-reader support come free
 * here and would all have to be rebuilt from nothing inside the game canvas.
 *
 * The accent colour is threaded through so each building's panel keeps the
 * colour of its roof. It is the small continuity that makes stepping through
 * a door feel like entering *that* building rather than opening a modal.
 */

interface Props {
  title: string;
  kicker: string;
  accent: string;
  intro?: ReactNode;
  children: ReactNode;
}

export function PanelFrame({ title, kicker, accent, intro, children }: Props) {
  const closePanel = useGameStore((state) => state.closePanel);
  useEscapeKey(closePanel);

  const containerRef = useRef<HTMLDivElement>(null);

  // Focus moves into the panel so the keyboard goes with it, and so the
  // arrow keys scroll the content rather than nudging a character the player
  // can no longer see.
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink/85 p-3"
      onClick={(event) => {
        if (event.target === event.currentTarget) closePanel();
      }}
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
        className="pixel-panel anim-rise flex max-h-[94vh] w-full max-w-3xl flex-col outline-none"
        style={{
          boxShadow: `inset 0 0 0 3px #f4f4f8, inset 0 0 0 6px ${accent}, 0 6px 0 0 rgb(16 16 28 / 0.55)`,
        }}
      >
        <header className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
          <div>
            <p className="font-pixel text-[9px] tracking-[0.2em]" style={{ color: accent }}>
              {kicker}
            </p>
            <h2 id="panel-title" className="mt-2 font-pixel text-[15px] leading-snug text-ink">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={closePanel}
            className="pixel-tab shrink-0 px-3 py-2 text-[9px]"
            aria-label="Leave the building"
          >
            ESC ×
          </button>
        </header>

        {intro && (
          <div className="border-y-2 border-dotted border-paper3 bg-paper2/60 px-6 py-3">
            <p className="text-sm leading-relaxed text-ink2">{intro}</p>
          </div>
        )}

        <div className="pixel-scroll flex-1 overflow-y-auto px-6 py-5">{children}</div>

        <footer className="border-t-2 border-dotted border-paper3 px-6 py-3">
          <p className="font-pixel text-[8px] text-ink3">
            PRESS <span className="text-blue">ESC</span> OR CLICK OUTSIDE TO STEP BACK OUT
          </p>
        </footer>
      </div>
    </div>
  );
}

/**
 * A segmented meter, as used for stats in the era. Blocks rather than a
 * continuous bar: twenty discrete steps are easier to compare at a glance
 * than two bars of slightly different length, and it matches the pixel grid.
 */
export function StatMeter({ level, color }: { level: number; color: string }) {
  const segments = 20;
  const filled = Math.round((Math.max(0, Math.min(100, level)) / 100) * segments);
  return (
    <span className="flex gap-[2px]" role="img" aria-label={`${level} out of 100`}>
      {Array.from({ length: segments }, (_, i) => (
        <span
          key={i}
          className="h-3 w-[5px] border border-ink"
          style={{ background: i < filled ? color : 'rgba(123,123,150,0.22)' }}
        />
      ))}
    </span>
  );
}

/** A small pill for technology names. */
export function TechChip({ label }: { label: string }) {
  return (
    <span className="border-2 border-ink bg-paper2 px-2 py-1 font-pixel text-[8px] text-ink2">
      {label}
    </span>
  );
}

import { useEffect } from 'react';
import { ALL_BADGES, BADGE_META, useGameStore } from '../state/useGameStore.ts';

/**
 * The badge tray and the toast that fires when a new one is earned.
 *
 * Five slots, always all five visible, empty ones included. Showing the
 * gaps is the whole mechanism: a visitor who can see there are two badges
 * they have not collected has a reason to go and find the buildings they
 * have not opened yet, which is the only nudge this portfolio gets to make.
 */

export function BadgeTray() {
  const badges = useGameStore((state) => state.badges);
  const earned = ALL_BADGES.filter((badge) => badges[badge]).length;

  return (
    <div className="pixel-frame pointer-events-auto px-2.5 py-2">
      <p className="mb-1.5 font-pixel text-[8px] tracking-[0.15em] text-gold">
        BADGES {earned}/{ALL_BADGES.length}
      </p>
      <ul className="flex gap-1.5">
        {ALL_BADGES.map((badge) => {
          const meta = BADGE_META[badge];
          const has = Boolean(badges[badge]);
          return (
            <li key={badge}>
              <span
                title={has ? meta.label : 'Not found yet'}
                className="flex h-6 w-6 items-center justify-center border-2 text-[11px] leading-none"
                style={{
                  borderColor: '#10101c',
                  background: has ? meta.color : 'rgba(123, 123, 150, 0.25)',
                  color: has ? '#10101c' : 'rgba(244, 244, 248, 0.35)',
                }}
              >
                {has ? meta.icon : '?'}
                <span className="sr-only">
                  {has ? `${meta.label} earned` : 'Badge not yet found'}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function BadgeToast() {
  const badgeToast = useGameStore((state) => state.badgeToast);
  const clear = useGameStore((state) => state.clearBadgeToast);

  useEffect(() => {
    if (!badgeToast) return;
    const timer = window.setTimeout(clear, 2600);
    return () => window.clearTimeout(timer);
  }, [badgeToast, clear]);

  if (!badgeToast) return null;
  const meta = BADGE_META[badgeToast];

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-24 z-40 -translate-x-1/2"
      role="status"
      aria-live="polite"
    >
      <div className="pixel-panel anim-badge flex items-center gap-3 px-5 py-3">
        <span
          className="flex h-9 w-9 items-center justify-center border-2 border-ink text-base"
          style={{ background: meta.color, color: '#10101c' }}
        >
          {meta.icon}
        </span>
        <span>
          <span className="block font-pixel text-[8px] tracking-[0.15em] text-blue">
            BADGE EARNED
          </span>
          <span className="mt-1 block font-pixel text-[10px] text-ink">{meta.label}</span>
        </span>
      </div>
    </div>
  );
}

import { content } from '../content/portfolio.ts';
import { useGameStore } from '../state/useGameStore.ts';
import { PixelCharacter } from '../boot/PixelCharacter.tsx';
import { useEscapeKey } from './hooks.ts';

/**
 * The tutorial card.
 *
 * Shown once automatically, and reopenable with H forever after. It is
 * deliberately short: the house the player wakes up in teaches the controls
 * properly — walk to the frame, press E, read the notes by the door — and
 * this card only has to cover the two things a visitor cannot discover by
 * trying, which are that the buildings are the portfolio and that there are
 * badges to collect.
 */

const ROWS: Array<{ keys: string; what: string }> = [
  { keys: 'W A S D  /  ↑ ← ↓ →', what: 'Walk around' },
  { keys: 'Hold SHIFT', what: 'Run' },
  { keys: 'E  or  ENTER', what: 'Read signs, talk to people, enter buildings' },
  { keys: 'M', what: 'Open the map (and travel to places you have found)' },
  { keys: 'Click the ground', what: 'Walk to that spot' },
  { keys: 'H', what: 'Show this card again' },
  { keys: 'ESC', what: 'Close anything' },
];

export function Tutorial() {
  const close = useGameStore((state) => state.setTutorialOpen);
  const dismiss = () => close(false);
  useEscapeKey(dismiss);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/80 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
        className="pixel-panel anim-rise pixel-scroll max-h-[88vh] w-full max-w-xl overflow-y-auto px-6 py-6"
      >
        <div className="flex items-start gap-4">
          <PixelCharacter scale={3} className="shrink-0" />
          <div>
            <p className="font-pixel text-[9px] tracking-[0.2em] text-blue">HOW TO PLAY</p>
            <h2 id="tutorial-title" className="mt-2 font-pixel text-[15px] leading-snug text-ink">
              Welcome to Portfolio Town
            </h2>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-ink2">
          You are in {content.trainer.name}&rsquo;s house. Step outside and you will find four
          buildings — the <strong>Skill Centre</strong>, the <strong>Story Theatre</strong>,{' '}
          <strong>Project Builds</strong> and the <strong>Contact Centre</strong>. Each one is a
          section of the portfolio. Walk up to a door to go in.
        </p>

        <ul className="mt-5 space-y-2">
          {ROWS.map((row) => (
            <li
              key={row.keys}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b-2 border-dotted border-paper3 pb-2 last:border-0"
            >
              <span className="font-pixel text-[9px] whitespace-nowrap text-blue">{row.keys}</span>
              <span className="text-sm text-ink2">{row.what}</span>
            </li>
          ))}
        </ul>

        <p className="mt-5 text-sm leading-relaxed text-ink2">
          There is a badge in each building, and a fifth one hidden somewhere in the town. Find all
          five and you have seen everything.
        </p>

        <div className="mt-6 flex justify-end">
          <button type="button" onClick={dismiss} className="pixel-btn px-7 py-3 text-xs" autoFocus>
            LET&rsquo;S GO ▶
          </button>
        </div>
      </div>
    </div>
  );
}

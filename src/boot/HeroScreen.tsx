import { content } from '../content/portfolio.ts';
import { PixelCharacter } from './PixelCharacter.tsx';

/**
 * The title screen.
 *
 * It has one job: make it obvious within a second that this is a game and
 * that pressing one button starts it. Everything else — who you are, what
 * the controls are — is secondary text, because a visitor who has to read a
 * paragraph before they can start has already half left.
 *
 * EXPLORE is a real <button>, so it is reachable by Tab and activates on
 * Enter or Space with no extra handling.
 */

const CLOUDS = [
  { top: '12%', duration: '48s', delay: '0s', scale: 1 },
  { top: '26%', duration: '66s', delay: '-18s', scale: 0.7 },
  { top: '66%', duration: '58s', delay: '-34s', scale: 0.85 },
];

interface Props {
  onExplore: () => void;
  onPlainMode: () => void;
}

export function HeroScreen({ onExplore, onPlainMode }: Props) {
  return (
    <div className="fixed inset-0 z-40 overflow-hidden bg-ink">
      {/* Sky */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #2854a0 0%, #3878c8 42%, #58a8e8 70%, #6cb050 70.1%, #4c9038 100%)',
        }}
      />

      {/* Drifting clouds, built from blocks so they match the world's art. */}
      {CLOUDS.map((cloud, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 motion-reduce:hidden"
          style={{
            top: cloud.top,
            transform: `scale(${cloud.scale})`,
            animation: `drift ${cloud.duration} linear ${cloud.delay} infinite`,
          }}
        >
          <div className="flex items-end opacity-80">
            <span className="block h-4 w-10 bg-paper" />
            <span className="block h-7 w-16 bg-paper" />
            <span className="block h-5 w-12 bg-paper" />
          </div>
        </div>
      ))}

      <style>{`
        @keyframes drift {
          from { transform: translateX(-20vw); }
          to   { transform: translateX(120vw); }
        }
      `}</style>

      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-7 px-6 text-center">
        <p className="font-pixel text-[10px] tracking-[0.35em] text-gold drop-shadow-[0_2px_0_#10101c]">
          A PORTFOLIO YOU PLAY
        </p>

        <h1 className="font-pixel text-[clamp(1.5rem,6vw,3.25rem)] leading-tight text-paper drop-shadow-[0_4px_0_#10101c]">
          {content.trainer.name}
        </h1>

        <div className="pixel-panel max-w-xl px-5 py-4">
          <p className="font-pixel text-[11px] leading-relaxed text-blue">
            {content.trainer.title}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink2">{content.trainer.tagline}</p>
        </div>

        <PixelCharacter scale={4} animate className="anim-bob" />

        <button
          type="button"
          onClick={onExplore}
          className="pixel-btn px-10 py-4 text-sm tracking-[0.2em]"
          autoFocus
        >
          EXPLORE ▶
        </button>

        <p className="font-pixel text-[9px] leading-loose text-ink drop-shadow-[0_1px_0_#f4f4f8]">
          WASD / ARROWS TO WALK &nbsp;·&nbsp; E TO INTERACT &nbsp;·&nbsp; M FOR MAP
        </p>

        {/*
          An honest way out for anyone who cannot or would rather not play:
          a screen-reader user, a keyboard-only visitor, or a recruiter with
          four minutes. The same content, as a page.
        */}
        <button
          type="button"
          onClick={onPlainMode}
          className="font-pixel text-[9px] text-ink underline decoration-2 underline-offset-4 hover:text-paper"
        >
          or read it as a plain page
        </button>
      </div>
    </div>
  );
}

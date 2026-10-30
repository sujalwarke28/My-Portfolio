import { useEffect, useState } from 'react';
import { useGameStore } from '../state/useGameStore.ts';
import { prefersReducedMotion } from '../state/storage.ts';

/**
 * The GBA dialogue box, with the characteristic typewriter reveal.
 *
 * The reveal is driven by a timer rather than a CSS animation because the
 * game needs to know when it has finished: the interact key means "show me
 * the rest of this line" until the line is complete, and "next line"
 * afterwards. That handshake runs through `revealed` in the store.
 *
 * The box is a div and not a button on purpose. A focusable element here
 * would swallow the very keys that advance the text — `Input` hands key
 * events straight to any focused button — so clicking the box once would
 * silently break E for the rest of the conversation. Advancing stays
 * keyboard-accessible through the global E / Enter binding, and the text is
 * announced with aria-live.
 */

const CHAR_MS = 22;

export function DialogueBox() {
  const dialogue = useGameStore((state) => state.dialogue);
  const advance = useGameStore((state) => state.advanceDialogue);
  const markRevealed = useGameStore((state) => state.markRevealed);

  const line = dialogue ? (dialogue.lines[dialogue.index] ?? '') : '';
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!dialogue) return;
    if (dialogue.revealed) {
      setShown(line.length);
      return;
    }
    if (prefersReducedMotion()) {
      setShown(line.length);
      markRevealed();
      return;
    }

    setShown(0);
    let count = 0;
    const timer = window.setInterval(() => {
      count += 1;
      setShown(count);
      if (count >= line.length) {
        window.clearInterval(timer);
        markRevealed();
      }
    }, CHAR_MS);
    return () => window.clearInterval(timer);
  }, [dialogue, line, markRevealed]);

  if (!dialogue) return null;

  const done = shown >= line.length;
  const isLast = dialogue.index >= dialogue.lines.length - 1;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-3">
      <div
        onClick={advance}
        className="pixel-panel pointer-events-auto w-full max-w-2xl cursor-pointer px-5 py-4"
      >
        <p className="font-pixel text-[9px] tracking-[0.15em] text-blue">{dialogue.speaker}</p>
        <p
          className="mt-2.5 min-h-[3.25rem] text-[0.95rem] leading-relaxed text-ink"
          aria-live="polite"
        >
          {line.slice(0, shown)}
          {/* A block cursor reads as a GBA text box; a caret would read as a
              form field. */}
          {!done && <span className="ml-0.5 inline-block h-3.5 w-2 bg-ink align-middle" />}
        </p>
        <p className="mt-2 text-right font-pixel text-[8px] text-ink3">
          {done ? (
            <span className="anim-blink text-blue">
              {isLast ? 'E / CLICK TO CLOSE ▼' : 'E / CLICK FOR MORE ▼'}
            </span>
          ) : (
            <span>E TO SKIP</span>
          )}
        </p>
      </div>
    </div>
  );
}

import type { Direction } from '../game/input.ts';
import { useGame } from './GameContext.tsx';

/**
 * On-screen controls for touch devices.
 *
 * A keyboard-only game is unusable on a phone, and a portfolio that cannot
 * be opened on a phone may as well not exist — most links get tapped, not
 * clicked. The pad pushes "virtual" input into the same `Input` object the
 * keyboard feeds, so the engine has no idea which one it is reading.
 *
 * Pointer capture is the important detail: without it, sliding a thumb off
 * a button never fires its release and the player walks away on their own.
 */

const DPAD: Array<{ direction: Direction; label: string; area: string }> = [
  { direction: 'up', label: '▲', area: '1 / 2 / 2 / 3' },
  { direction: 'left', label: '◀', area: '2 / 1 / 3 / 2' },
  { direction: 'right', label: '▶', area: '2 / 3 / 3 / 4' },
  { direction: 'down', label: '▼', area: '3 / 2 / 4 / 3' },
];

export function TouchControls() {
  const game = useGame();

  const hold = (direction: Direction) => (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    game.input.setVirtualDirection(direction);
  };

  const release = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    game.input.setVirtualDirection(null);
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-4 p-4 pb-6">
      <div
        className="pointer-events-auto grid touch-none select-none"
        style={{ gridTemplate: 'repeat(3, 3.25rem) / repeat(3, 3.25rem)' }}
      >
        {DPAD.map((button) => (
          <button
            key={button.direction}
            type="button"
            style={{ gridArea: button.area }}
            onPointerDown={hold(button.direction)}
            onPointerUp={release}
            onPointerCancel={release}
            onContextMenu={(event) => event.preventDefault()}
            className="pixel-frame flex items-center justify-center text-base text-paper2 active:text-gold"
            aria-label={`Walk ${button.direction}`}
          >
            <span aria-hidden="true">{button.label}</span>
          </button>
        ))}
      </div>

      <div className="pointer-events-auto flex touch-none select-none flex-col items-center gap-3">
        <button
          type="button"
          onPointerDown={(event) => {
            event.preventDefault();
            game.input.pressVirtual('map');
          }}
          className="pixel-frame h-11 w-11 font-pixel text-[11px] text-paper2 active:text-gold"
          aria-label="Open the map"
        >
          M
        </button>
        <button
          type="button"
          onPointerDown={(event) => {
            event.preventDefault();
            game.input.pressVirtual('interact');
          }}
          className="pixel-btn h-16 w-16 font-pixel text-sm"
          aria-label="Interact"
        >
          E
        </button>
      </div>
    </div>
  );
}

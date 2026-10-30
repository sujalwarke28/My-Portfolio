export type Direction = 'up' | 'down' | 'left' | 'right';
export type ActionName = 'interact' | 'map' | 'cancel' | 'help';

/**
 * All keyboard and pointer input, in one object.
 *
 * Centralising this matters more than it looks: if React components also
 * bound their own key handlers, a single press of M would be seen twice —
 * once by the overlay and once by the loop — and the map would open and
 * immediately close. So every key is read here and dispatched as an action,
 * and the overlays stay purely declarative, driven by store state.
 *
 * Keys are matched on `event.code` (physical position) with `event.key` as a
 * fallback, so the WASD cluster stays under the same four fingers on AZERTY
 * and Dvorak layouts instead of scattering.
 */

const DIRECTION_CODES: Record<string, Direction> = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
};

const DIRECTION_KEYS: Record<string, Direction> = {
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
  arrowup: 'up',
  arrowdown: 'down',
  arrowleft: 'left',
  arrowright: 'right',
};

const ACTION_CODES: Record<string, ActionName> = {
  KeyE: 'interact',
  Enter: 'interact',
  NumpadEnter: 'interact',
  Space: 'interact',
  KeyM: 'map',
  Escape: 'cancel',
  KeyH: 'help',
  Slash: 'help',
};

/** Keys whose default browser behaviour would fight the game. */
const SWALLOW = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Space',
  'Slash',
  'Tab',
]);

/**
 * How long a released direction key still counts. Just under one walking
 * step (140ms), so a buffered tap can produce at most one step.
 */
const TAP_BUFFER_MS = 120;

export interface ClickPoint {
  /** Position within the canvas element, in CSS pixels. */
  x: number;
  y: number;
}

export class Input {
  /**
   * Held directions in press order. Order is the point: when a player holds
   * right and then presses down without releasing right, they expect to go
   * down. Taking the most recent press rather than a fixed priority is what
   * makes cornering feel responsive rather than sticky.
   */
  private readonly order: Direction[] = [];
  private virtual: Direction | null = null;

  /**
   * The last direction pressed, kept alive briefly after release.
   *
   * Without this, a tap shorter than a frame is simply lost: the key goes
   * down and up between two animation frames, so by the time the loop asks
   * what is held, the answer is "nothing" and the character does not move.
   * Players tap directions constantly to turn and nudge, and a game that
   * drops those taps feels broken in a way that is very hard to point at.
   *
   * The window is just under one step, so a buffered tap can only ever
   * produce a single step, never a stutter of two.
   */
  private lastTap: { direction: Direction; at: number } | null = null;

  /**
   * Whether the world currently wants the movement keys.
   *
   * Set to false while an overlay is open, which stops the arrow keys and
   * space being swallowed — otherwise a long projects panel could not be
   * scrolled with the keyboard, because the game would be eating exactly the
   * keys the browser needs to scroll it.
   */
  captureMovement = true;

  running = false;
  onAction: ((action: ActionName) => void) | null = null;

  private pendingClick: ClickPoint | null = null;
  private detachers: Array<() => void> = [];

  attach(canvas: HTMLCanvasElement): void {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isInteractiveTarget(event.target)) return;

      if (this.captureMovement && SWALLOW.has(event.code)) event.preventDefault();

      const direction =
        DIRECTION_CODES[event.code] ?? DIRECTION_KEYS[event.key.toLowerCase()] ?? null;
      if (direction) {
        if (this.captureMovement && !event.repeat) this.press(direction);
        return;
      }

      if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
        this.running = true;
        return;
      }

      if (event.repeat) return;
      const action = ACTION_CODES[event.code] ?? (event.key === '?' ? 'help' : null);
      if (action) this.onAction?.(action);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const direction =
        DIRECTION_CODES[event.code] ?? DIRECTION_KEYS[event.key.toLowerCase()] ?? null;
      if (direction) {
        this.release(direction);
        return;
      }
      if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') this.running = false;
    };

    /**
     * A lost window steals keyup events, which would otherwise leave the
     * player walking into a wall forever after an alt-tab.
     */
    const onBlur = () => {
      this.order.length = 0;
      this.virtual = null;
      this.lastTap = null;
      this.running = false;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const rect = canvas.getBoundingClientRect();
      this.pendingClick = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    canvas.addEventListener('pointerdown', onPointerDown);

    this.detachers = [
      () => window.removeEventListener('keydown', onKeyDown),
      () => window.removeEventListener('keyup', onKeyUp),
      () => window.removeEventListener('blur', onBlur),
      () => canvas.removeEventListener('pointerdown', onPointerDown),
    ];
  }

  detach(): void {
    for (const detach of this.detachers) detach();
    this.detachers = [];
  }

  private press(direction: Direction): void {
    this.release(direction);
    this.order.push(direction);
    this.lastTap = { direction, at: performance.now() };
  }

  private release(direction: Direction): void {
    const at = this.order.indexOf(direction);
    if (at !== -1) this.order.splice(at, 1);
  }

  /** The direction the player is asking for, or null when standing still. */
  direction(): Direction | null {
    const active = this.virtual ?? this.order[this.order.length - 1] ?? null;
    if (active) return active;
    if (this.lastTap && performance.now() - this.lastTap.at < TAP_BUFFER_MS) {
      return this.lastTap.direction;
    }
    return null;
  }

  /** Used by the on-screen D-pad on touch devices. */
  setVirtualDirection(direction: Direction | null): void {
    this.virtual = direction;
  }

  /** Fires an action from the on-screen buttons, as if a key were pressed. */
  pressVirtual(action: ActionName): void {
    this.onAction?.(action);
  }

  setVirtualRunning(running: boolean): void {
    this.running = running;
  }

  /** Clears every held key — called when an overlay takes the keyboard. */
  releaseAll(): void {
    this.order.length = 0;
    this.virtual = null;
    // Dropped as well, or a tap made just before a panel opened would fire
    // the instant it closes and walk the player somewhere unexpected.
    this.lastTap = null;
  }

  consumeClick(): ClickPoint | null {
    const click = this.pendingClick;
    this.pendingClick = null;
    return click;
  }
}

/**
 * Never swallow keys aimed at something that handles them itself.
 *
 * Buttons and links are in this list as well as form fields: Space is both
 * "interact" in this game and "activate the focused button" in every
 * browser, and a game that eats it makes the EXPLORE button unusable for
 * anyone navigating by keyboard.
 */
function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  switch (target.tagName) {
    case 'INPUT':
    case 'TEXTAREA':
    case 'SELECT':
    case 'BUTTON':
    case 'A':
      return true;
    default:
      return target.getAttribute('role') === 'button';
  }
}

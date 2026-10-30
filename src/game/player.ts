import type { Direction } from './input.ts';
import { TILE } from './art/atlas.ts';

export const STEP_MS = 140;
export const RUN_STEP_MS = 92;
/**
 * How long a tap turns the character in place before it commits to walking.
 *
 * This single number is most of what separates "feels like a GBA game" from
 * "feels like a tech demo". Without it, tapping a direction to look at a
 * sign also moves you a tile and you can never stand still facing something.
 * Much longer than this and the controls feel laggy.
 */
export const PIVOT_MS = 72;

export const DELTAS: Record<Direction, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

/**
 * Grid-locked movement, shared by the player and the townsfolk.
 *
 * Position is authoritative as a *tile*; the pixel position is derived by
 * interpolating across the step in progress. Doing it the other way round —
 * free pixel movement that snaps to tiles — is how you end up with
 * characters standing half-in walls.
 *
 * Interpolation is deliberately linear. Easing each step looks smooth in
 * isolation but when steps are chained (holding a direction) every tile
 * boundary becomes a slow-fast-slow pulse, and walking across the map
 * visibly throbs. Constant speed is both simpler and correct.
 */
export class GridMover {
  tx: number;
  ty: number;
  facing: Direction;

  /** Tile being stepped towards, equal to the current tile when idle. */
  private targetTx: number;
  private targetTy: number;
  private stepElapsed = 0;
  private stepDuration = STEP_MS;
  private pivotElapsed = 0;

  stepping = false;
  /** Counts completed steps; drives which leg the walk cycle shows. */
  stepsTaken = 0;

  constructor(tx: number, ty: number, facing: Direction) {
    this.tx = tx;
    this.ty = ty;
    this.targetTx = tx;
    this.targetTy = ty;
    this.facing = facing;
  }

  /** Pixel position of the sprite's 16x16 footprint. */
  get px(): number {
    if (!this.stepping) return this.tx * TILE;
    const t = this.stepElapsed / this.stepDuration;
    return (this.tx + (this.targetTx - this.tx) * t) * TILE;
  }

  get py(): number {
    if (!this.stepping) return this.ty * TILE;
    const t = this.stepElapsed / this.stepDuration;
    return (this.ty + (this.targetTy - this.ty) * t) * TILE;
  }

  /**
   * Frame index into the four-frame cycle [idle, stepA, idle, stepB].
   *
   * The leg extends during the first half of each step and plants on the
   * second, and which leg leads alternates per step, so a full cycle spans
   * two tiles. Driving this from step progress rather than wall-clock time
   * is what stops the feet sliding when the walk speed changes.
   */
  get animFrame(): number {
    if (!this.stepping) return 0;
    const half = this.stepElapsed / this.stepDuration < 0.5 ? 1 : 0;
    return (this.stepsTaken * 2 + half) % 4;
  }

  /** True once the mover has arrived and nothing new was requested. */
  get idle(): boolean {
    return !this.stepping;
  }

  beginStep(direction: Direction, running: boolean): void {
    const [dx, dy] = DELTAS[direction];
    this.facing = direction;
    this.targetTx = this.tx + dx;
    this.targetTy = this.ty + dy;
    this.stepElapsed = 0;
    this.stepDuration = running ? RUN_STEP_MS : STEP_MS;
    this.stepping = true;
  }

  /** Turns on the spot and arms the pivot delay. */
  turn(direction: Direction): void {
    if (this.facing === direction) return;
    this.facing = direction;
    this.pivotElapsed = 0;
  }

  /** True while the character is still turning and must not move yet. */
  pivoting(): boolean {
    return this.pivotElapsed < PIVOT_MS;
  }

  tickPivot(dt: number): void {
    this.pivotElapsed = Math.min(PIVOT_MS, this.pivotElapsed + dt);
  }

  clearPivot(): void {
    this.pivotElapsed = PIVOT_MS;
  }

  /**
   * Advances the current step. Returns true on the frame the step completes,
   * which is when the caller should fire triggers and footstep sounds.
   */
  advance(dt: number): boolean {
    if (!this.stepping) return false;
    this.stepElapsed += dt;
    if (this.stepElapsed < this.stepDuration) return false;
    this.tx = this.targetTx;
    this.ty = this.targetTy;
    this.stepping = false;
    this.stepsTaken++;
    // Overshoot is discarded rather than carried into the next step: at
    // 140ms a step, carrying it over is invisible, and discarding keeps the
    // tile grid and the animation phase exactly in sync.
    this.stepElapsed = 0;
    return true;
  }

  /**
   * The tile this character is stepping into, or the one it stands on when
   * idle. Characters reserve this so two movers never interpolate into the
   * same square and briefly overlap.
   */
  targetTile(): [number, number] {
    return [this.targetTx, this.targetTy];
  }

  /** The tile this character is looking at. */
  facingTile(): [number, number] {
    const [dx, dy] = DELTAS[this.facing];
    return [this.tx + dx, this.ty + dy];
  }

  teleport(tx: number, ty: number, facing: Direction): void {
    this.tx = tx;
    this.ty = ty;
    this.targetTx = tx;
    this.targetTy = ty;
    this.facing = facing;
    this.stepping = false;
    this.stepElapsed = 0;
    this.stepsTaken = 0;
    this.clearPivot();
  }
}

export class Player extends GridMover {
  /** Queued route from a mouse click, in tile coordinates. */
  path: Array<[number, number]> | null = null;
  /** Throttles the bump sound so holding into a wall is not a machine gun. */
  bumpCooldown = 0;

  cancelPath(): void {
    this.path = null;
  }

  /** The next direction the queued route calls for, if any. */
  pathDirection(): Direction | null {
    const next = this.path?.[0];
    if (!next) return null;
    const [nx, ny] = next;
    const dx = nx - this.tx;
    const dy = ny - this.ty;
    if (dx === 1 && dy === 0) return 'right';
    if (dx === -1 && dy === 0) return 'left';
    if (dx === 0 && dy === 1) return 'down';
    if (dx === 0 && dy === -1) return 'up';
    // The route desynchronised from our position — a warp, or an NPC that
    // walked across it. Drop it rather than trying to patch it up.
    this.path = null;
    return null;
  }

  consumePathStep(): void {
    this.path?.shift();
    if (this.path && this.path.length === 0) this.path = null;
  }
}

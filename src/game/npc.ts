import { GridMover, DELTAS, STEP_MS } from './player.ts';
import type { Direction } from './input.ts';
import { mulberry32 } from './art/draw.ts';
import type { NpcSpec } from './scenes.ts';

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];

/**
 * A townsperson who paces around a small box and has something to say.
 *
 * Wandering is kept deliberately slow and short-ranged. An NPC that roams
 * widely will eventually park itself in a doorway or on a path tile the
 * player needs, and the player has no way to ask it to move. Keeping each
 * one tethered to a two-or-three-tile box near where it started means it
 * reads as alive without ever becoming an obstacle.
 */
export class Npc extends GridMover {
  readonly spec: NpcSpec;
  private readonly homeTx: number;
  private readonly homeTy: number;
  private readonly rand: () => number;
  private waitMs: number;
  /** Set while the player is talking, so nobody wanders off mid-sentence. */
  held = false;

  constructor(spec: NpcSpec, seed: number) {
    super(spec.tx, spec.ty, spec.facing);
    this.spec = spec;
    this.homeTx = spec.tx;
    this.homeTy = spec.ty;
    this.rand = mulberry32(seed * 2654435761);
    this.waitMs = 600 + this.rand() * 2200;
  }

  /** Turns to look at whoever is talking to them. */
  faceToward(tx: number, ty: number): void {
    if (this.stepping) return;
    const dx = tx - this.tx;
    const dy = ty - this.ty;
    if (Math.abs(dx) >= Math.abs(dy)) this.facing = dx >= 0 ? 'right' : 'left';
    else this.facing = dy >= 0 ? 'down' : 'up';
  }

  update(dt: number, canEnter: (tx: number, ty: number) => boolean): void {
    if (this.advance(dt)) {
      this.waitMs = 900 + this.rand() * 2600;
      return;
    }
    if (this.stepping) return;
    if (this.held || !this.spec.wander) return;

    this.waitMs -= dt;
    if (this.waitMs > 0) return;

    const wander = this.spec.wander;
    const direction = DIRECTIONS[Math.floor(this.rand() * DIRECTIONS.length)]!;
    const [dx, dy] = DELTAS[direction];
    const nx = this.tx + dx;
    const ny = this.ty + dy;

    // Always turn, even when the step is refused — an NPC glancing around
    // while penned in still looks alive, where a frozen one looks broken.
    this.facing = direction;

    const insideBox =
      Math.abs(nx - this.homeTx) <= wander.rx && Math.abs(ny - this.homeTy) <= wander.ry;

    if (insideBox && canEnter(nx, ny)) {
      this.beginStep(direction, false);
    } else {
      this.waitMs = STEP_MS + this.rand() * 1200;
    }
  }
}

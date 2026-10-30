import { OBJECT_DEFS, sceneHeight, sceneWidth, type Scene } from './scenes.ts';
import { isSolidTile } from './world/tiles.ts';

/**
 * A scene's static blocking grid, flattened from its ground tiles and the
 * footprints of everything placed on it. Built once per scene rather than
 * queried through the object list every step, because movement checks run
 * on every frame and walking an object array per check would be wasteful.
 */
export class CollisionGrid {
  readonly w: number;
  readonly h: number;
  private readonly blocked: Uint8Array;

  constructor(scene: Scene) {
    this.w = sceneWidth(scene);
    this.h = sceneHeight(scene);
    this.blocked = new Uint8Array(this.w * this.h);

    for (let y = 0; y < this.h; y++) {
      const row = scene.ground[y]!;
      for (let x = 0; x < this.w; x++) {
        if (isSolidTile(row[x]!)) this.blocked[y * this.w + x] = 1;
      }
    }

    for (const placed of scene.objects) {
      const def = OBJECT_DEFS[placed.kind];
      if (!def.solid) continue;
      const { dx, dy, w, h } = def.solid;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          this.set(placed.tx + dx + x, placed.ty + dy + y, true);
        }
      }
      // Doorways are punched back out after the footprint is laid down, so
      // the order of the two never matters.
      for (const [hx, hy] of def.holes ?? []) {
        this.set(placed.tx + hx, placed.ty + hy, false);
      }
    }
  }

  private set(tx: number, ty: number, value: boolean): void {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return;
    this.blocked[ty * this.w + tx] = value ? 1 : 0;
  }

  /** Out-of-bounds counts as solid, which keeps the player inside the map. */
  solid(tx: number, ty: number): boolean {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return true;
    return this.blocked[ty * this.w + tx] === 1;
  }

  /**
   * Shortest walkable route between two tiles, as a list of steps excluding
   * the start. Breadth-first rather than A*: these maps are a few thousand
   * tiles, so the heuristic would save nothing measurable and BFS has no
   * tie-breaking quirks to debug.
   *
   * `extraBlocked` carries the NPCs, which move and so cannot live in the
   * static grid.
   */
  path(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    extraBlocked?: (tx: number, ty: number) => boolean,
  ): Array<[number, number]> | null {
    if (this.solid(toX, toY)) return null;
    if (fromX === toX && fromY === toY) return [];

    const start = fromY * this.w + fromX;
    const goal = toY * this.w + toX;
    const prev = new Int32Array(this.w * this.h).fill(-1);
    const seen = new Uint8Array(this.w * this.h);
    const queue = new Int32Array(this.w * this.h);
    let head = 0;
    let tail = 0;

    queue[tail++] = start;
    seen[start] = 1;

    while (head < tail) {
      const current = queue[head++]!;
      if (current === goal) {
        const steps: Array<[number, number]> = [];
        for (let node = goal; node !== start; node = prev[node]!) {
          steps.push([node % this.w, Math.floor(node / this.w)]);
        }
        return steps.reverse();
      }
      const cx = current % this.w;
      const cy = Math.floor(current / this.w);
      for (const [dx, dy] of NEIGHBOURS) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (this.solid(nx, ny)) continue;
        if (extraBlocked?.(nx, ny)) continue;
        const next = ny * this.w + nx;
        if (seen[next]) continue;
        seen[next] = 1;
        prev[next] = current;
        queue[tail++] = next;
      }
    }
    return null;
  }

  /** Every tile reachable on foot from a starting tile. */
  reachableFrom(tx: number, ty: number): Uint8Array {
    const seen = new Uint8Array(this.w * this.h);
    if (this.solid(tx, ty)) return seen;
    const queue: number[] = [ty * this.w + tx];
    seen[ty * this.w + tx] = 1;
    while (queue.length) {
      const current = queue.pop()!;
      const cx = current % this.w;
      const cy = Math.floor(current / this.w);
      for (const [dx, dy] of NEIGHBOURS) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (this.solid(nx, ny)) continue;
        const next = ny * this.w + nx;
        if (seen[next]) continue;
        seen[next] = 1;
        queue.push(next);
      }
    }
    return seen;
  }
}

const NEIGHBOURS: Array<[number, number]> = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

/**
 * Development-only sanity check: every trigger, NPC and spawn in a scene must
 * be standing on, or next to, somewhere the player can actually walk from
 * the scene's entry point.
 *
 * This exists because the town's trees are scattered procedurally. One
 * unlucky seed dropping a tree across a path would silently make a whole
 * building unreachable, and the only symptom would be a visitor wandering
 * for a while and then leaving. Failing loudly at boot is far better.
 */
export function assertSceneConnected(scene: Scene, entrySpawn: string): void {
  if (!import.meta.env.DEV) return;

  const entry = scene.spawns[entrySpawn];
  if (!entry) throw new Error(`[map] scene "${scene.id}" has no spawn "${entrySpawn}"`);

  const grid = new CollisionGrid(scene);
  const reachable = grid.reachableFrom(entry.tx, entry.ty);
  const canReach = (tx: number, ty: number) =>
    tx >= 0 && ty >= 0 && tx < grid.w && ty < grid.h && reachable[ty * grid.w + tx] === 1;
  /** Interactables are fine if the player can stand beside them. */
  const canReachOrNeighbour = (tx: number, ty: number) =>
    canReach(tx, ty) ||
    canReach(tx + 1, ty) ||
    canReach(tx - 1, ty) ||
    canReach(tx, ty + 1) ||
    canReach(tx, ty - 1);

  const problems: string[] = [];

  for (const trigger of scene.triggers) {
    if (!canReachOrNeighbour(trigger.tx, trigger.ty)) {
      problems.push(`${trigger.kind} trigger at (${trigger.tx}, ${trigger.ty}) is walled off`);
    }
  }
  for (const npc of scene.npcs) {
    if (!canReachOrNeighbour(npc.tx, npc.ty)) {
      problems.push(`npc "${npc.id}" at (${npc.tx}, ${npc.ty}) is walled off`);
    }
  }
  for (const [name, spawn] of Object.entries(scene.spawns)) {
    if (!canReach(spawn.tx, spawn.ty)) {
      problems.push(`spawn "${name}" at (${spawn.tx}, ${spawn.ty}) is unreachable or inside a wall`);
    }
  }

  if (problems.length) {
    throw new Error(
      `[map] scene "${scene.id}" is not fully connected from spawn "${entrySpawn}":\n  ` +
        problems.join('\n  '),
    );
  }
}

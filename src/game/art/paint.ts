import { Px, mulberry32 } from './draw.ts';

/**
 * Painters for everything that isn't a character.
 *
 * These are drawn with primitives rather than authored as literal pixel
 * strings because the shapes are geometric: a roof is a stack of narrowing
 * rows, a plank floor is a grid of lines. Expressing them as code means the
 * five buildings share one painter, and sizes are parameters rather than
 * sixty-four-character strings that have to be counted by hand.
 */

export const TILE = 16;

// ---------------------------------------------------------------------------
// Terrain
// ---------------------------------------------------------------------------

/**
 * Grass, with deterministic tufts. The seed is the point: an unseeded
 * scatter would redraw differently on every load and the whole town would
 * visibly shimmer between reloads.
 */
export function paintGrass(seed: number): Px {
  const p = new Px(TILE, TILE, 'g');
  const rand = mulberry32(seed);
  const tufts = 3 + Math.floor(rand() * 3);
  for (let i = 0; i < tufts; i++) {
    const x = 1 + Math.floor(rand() * (TILE - 3));
    const y = 2 + Math.floor(rand() * (TILE - 4));
    // A tiny three-pixel 'v' reads as a blade of grass at this scale.
    p.set(x, y, 'G').set(x + 2, y, 'G').set(x + 1, y + 1, 'G');
  }
  p.speckle(seed * 7 + 1, ['v'], 2);
  return p;
}

/** Waist-high grass: the same base with darker, taller blades over it. */
export function paintTallGrass(seed: number): Px {
  const p = paintGrass(seed);
  const rand = mulberry32(seed * 13 + 5);
  for (let i = 0; i < 7; i++) {
    const x = 1 + Math.floor(rand() * (TILE - 2));
    const y = 4 + Math.floor(rand() * (TILE - 7));
    p.vline(x, y, 4, 'v');
    p.set(x - 1, y + 2, 'T');
    p.set(x + 1, y + 1, 'T');
  }
  return p;
}

/** Packed dirt path. */
export function paintPath(seed: number): Px {
  const p = new Px(TILE, TILE, 'p');
  p.speckle(seed, ['P'], 14);
  p.speckle(seed * 3 + 2, ['o'], 5);
  return p;
}

/** Paler sand, used for the plaza. */
export function paintSand(seed: number): Px {
  const p = new Px(TILE, TILE, 'P');
  p.speckle(seed, ['p'], 16);
  p.speckle(seed * 5 + 3, ['o'], 4);
  return p;
}

/**
 * Water, four frames. The wave bands scroll by two pixels a frame, which at
 * ~5fps is the lazy drift the GBA games used rather than a fast ripple.
 *
 * The bands undulate rather than running dead straight. Flat horizontal
 * stripes tile into one continuous line across a whole pond and read as a
 * barcode; the sine has a period of exactly one tile, so the waves still
 * meet correctly at every tile boundary.
 *
 * Sparkles are deliberately *not* drawn here. A highlight baked into the
 * tile appears at the same spot in every tile of the pond, which is the
 * fastest way to make a repeating texture look like a grid. The renderer
 * scatters them per position instead.
 */
export function paintWater(frame: number): Px {
  const p = new Px(TILE, TILE, 'w');
  const offset = frame * 2;
  for (let x = 0; x < TILE; x++) {
    const wave = Math.round(1.6 * Math.sin((x / TILE) * Math.PI * 2));
    for (let y = 0; y < TILE; y++) {
      const band = (((y + wave + offset) % 8) + 8) % 8;
      if (band < 2) p.set(x, y, 'W');
      else if (band === 2) p.set(x, y, 'u');
    }
  }
  return p;
}

/** Flowerbed over grass. `hue` picks red or yellow blooms. */
export function paintFlowers(seed: number, hue: 'f' | 'F'): Px {
  const p = paintGrass(seed);
  const rand = mulberry32(seed * 17 + 9);
  for (let i = 0; i < 5; i++) {
    const x = 2 + Math.floor(rand() * (TILE - 4));
    const y = 2 + Math.floor(rand() * (TILE - 4));
    // A four-petal bloom with a pale centre.
    p.set(x, y - 1, hue).set(x, y + 1, hue).set(x - 1, y, hue).set(x + 1, y, hue);
    p.set(x, y, '5');
  }
  return p;
}

// ---------------------------------------------------------------------------
// Interior surfaces
// ---------------------------------------------------------------------------

/** Plank flooring. The seam offset per row stops it reading as a grid. */
export function paintFloor(seed: number): Px {
  const p = new Px(TILE, TILE, 'd');
  for (let y = 3; y < TILE; y += 4) p.hline(0, y, TILE, 'D');
  const rand = mulberry32(seed);
  for (let y = 0; y < TILE; y += 4) {
    const seam = Math.floor(rand() * TILE);
    p.vline(seam, y, 3, 'D');
  }
  return p;
}

/** A wallpapered wall, with vertical stripes. */
export function paintWall(): Px {
  const p = new Px(TILE, TILE, 'C');
  for (let x = 1; x < TILE; x += 4) p.vline(x, 0, TILE, 'c');
  p.speckle(99, ['n'], 3);
  return p;
}

/** The bottom course of wall, with timber skirting. */
export function paintWallBase(): Px {
  const p = paintWall();
  p.rect(0, TILE - 5, TILE, 3, 'd');
  p.hline(0, TILE - 5, TILE, 'D');
  p.rect(0, TILE - 2, TILE, 2, 'D');
  return p;
}

/**
 * Off-map filler. Solid, and never actually reachable.
 *
 * Deep forest shadow rather than flat black: the border of the town should
 * read as woods carrying on past where you can go, not as the edge of the
 * screen buffer.
 */
export function paintVoid(): Px {
  const p = new Px(TILE, TILE, 'y');
  p.speckle(7, ['T'], 6);
  p.speckle(13, ['0'], 10);
  return p;
}

// ---------------------------------------------------------------------------
// Scenery objects
// ---------------------------------------------------------------------------

/**
 * A tree: one tile of trunk, a canopy rising two tiles above it.
 *
 * Three shapes, because the treeline that walls the town in is the single
 * most repeated sprite in the game, and a row of forty identical trees reads
 * as a hedge of clones rather than as woodland. Varying the canopy and the
 * trunk height is enough to break the pattern at a glance.
 */
const TREE_SHAPES = [
  { rx: 7, ry: 11, cy: 12, trunk: 10, hx: 7, hy: 10 },
  { rx: 8, ry: 9, cy: 13, trunk: 9, hx: 9, hy: 12 },
  { rx: 6, ry: 12, cy: 11, trunk: 11, hx: 6, hy: 8 },
] as const;

export const TREE_VARIANTS = TREE_SHAPES.length;

export function paintTree(variant = 0): Px {
  const shape = TREE_SHAPES[variant % TREE_VARIANTS]!;
  const p = new Px(TILE, TILE * 2);
  const trunkTop = TILE * 2 - shape.trunk;

  p.vline(6, trunkTop, shape.trunk, 'K');
  p.rect(7, trunkTop, 3, shape.trunk, 'k');
  p.vline(9, trunkTop, shape.trunk, 'K');

  p.ellipse(8, shape.cy, shape.rx, shape.ry, 'y');
  p.ellipse(8, shape.cy, shape.rx - 1, shape.ry - 1, 'T');
  p.ellipse(shape.hx, shape.hy, 4, 5, 't');
  p.ellipse(shape.hx - 1, shape.hy - 2, 2, 3, 't');
  return p;
}

export function paintBush(): Px {
  const p = new Px(TILE, TILE);
  p.ellipse(8, 9, 7, 6, 'y');
  p.ellipse(8, 9, 6, 5, 'T');
  p.ellipse(6, 7, 3, 2, 't');
  return p;
}

export function paintRock(): Px {
  const p = new Px(TILE, TILE);
  p.ellipse(8, 10, 6, 5, '1');
  p.ellipse(8, 10, 5, 4, '2');
  p.ellipse(6, 8, 2, 2, '3');
  return p;
}

export function paintFence(orientation: 'h' | 'v'): Px {
  const p = new Px(TILE, TILE);
  if (orientation === 'h') {
    p.rect(0, 6, TILE, 2, 'd');
    p.rect(0, 10, TILE, 2, 'd');
    p.hline(0, 6, TILE, 'D');
    p.hline(0, 11, TILE, 'D');
    p.rect(7, 3, 3, 12, 'd');
    p.vline(7, 3, 12, 'D');
    p.vline(9, 3, 12, 'D');
  } else {
    p.rect(6, 0, 2, TILE, 'd');
    p.rect(10, 0, 2, TILE, 'd');
    p.vline(6, 0, TILE, 'D');
    p.vline(11, 0, TILE, 'D');
  }
  return p;
}

/** A signpost. The board is blank — words are drawn by the renderer. */
export function paintSign(): Px {
  const p = new Px(TILE, TILE);
  p.rect(7, 10, 2, 6, 'D');
  p.rect(1, 2, 14, 9, '0');
  p.rect(2, 3, 12, 7, 'd');
  p.hline(3, 5, 10, 'D');
  p.hline(3, 7, 8, 'D');
  return p;
}

/** A lamp post, two tiles tall, for the plaza. */
export function paintLamp(): Px {
  const p = new Px(TILE, TILE * 2);
  p.rect(7, 10, 2, 22, 'M');
  p.rect(6, 30, 4, 2, '1');
  p.rect(4, 4, 8, 7, '0');
  p.rect(5, 5, 6, 5, 'F');
  p.rect(6, 6, 4, 3, '5');
  p.rect(5, 2, 6, 2, 'M');
  return p;
}

// ---------------------------------------------------------------------------
// Buildings
// ---------------------------------------------------------------------------

export interface BuildingSpec {
  /** Footprint in tiles. */
  tilesW: number;
  tilesH: number;
  /** Door position, in tiles from the building's left edge. */
  doorTx: number;
  /** Palette character for the plaque emblem above the door. */
  emblem: string;
}

/**
 * One painter for all five buildings. The roof is built row by row as a
 * trapezoid so the eaves overhang the walls, which is the single detail that
 * most makes a top-down building look like a building rather than a box.
 * Colour comes from the tint map applied at rasterisation, so this same
 * surface serves the house, the centre, the theatre, the mart and the office.
 */
export function paintBuilding(spec: BuildingSpec): Px {
  const w = spec.tilesW * TILE;
  const h = spec.tilesH * TILE;
  const p = new Px(w, h);

  const roofH = Math.max(22, Math.round(h * 0.5));
  const inset = Math.max(6, Math.round(w * 0.14));

  // Roof slopes: each row widens toward the eaves.
  for (let y = 0; y < roofH; y++) {
    const t = roofH === 1 ? 1 : y / (roofH - 1);
    const left = Math.round(inset * (1 - t));
    const right = w - 1 - left;
    const shingle = Math.floor(y / 3) % 2 === 0 ? 'r' : 'R';
    p.hline(left, y, right - left + 1, shingle);
    p.set(left, y, '0');
    p.set(right, y, '0');
  }
  // Ridge along the top, then the overhanging eave band.
  p.hline(inset, 0, w - inset * 2, '0');
  p.rect(0, roofH, w, 3, 'e');
  p.hline(0, roofH, w, '0');
  p.hline(0, roofH + 2, w, '0');

  // Walls.
  const wallTop = roofH + 3;
  p.rect(0, wallTop, w, h - wallTop, 'c');
  p.speckle(spec.tilesW * 31 + spec.tilesH, ['C'], Math.round(w * 0.6));
  p.vline(0, wallTop, h - wallTop, '0');
  p.vline(w - 1, wallTop, h - wallTop, '0');
  p.hline(0, h - 1, w, '0');
  // A shadow line where the wall meets the ground sells the height.
  p.hline(1, h - 2, w - 2, 'n');

  // Windows, set symmetrically either side of the door.
  const windowY = wallTop + 4;
  const windowH = Math.min(10, h - windowY - 10);
  if (windowH >= 6) {
    for (const wx of windowPositions(w, spec.doorTx * TILE)) {
      p.rect(wx, windowY, 12, windowH, '0');
      p.rect(wx + 1, windowY + 1, 10, windowH - 2, 'q');
      p.rect(wx + 1, windowY + 1, 5, Math.floor((windowH - 2) / 2), 'Q');
      p.vline(wx + 6, windowY + 1, windowH - 2, 'd');
      p.hline(wx + 1, windowY + Math.floor(windowH / 2), 10, 'd');
    }
  }

  // Door, flush with the bottom edge.
  const doorX = spec.doorTx * TILE;
  const doorH = Math.min(22, h - wallTop - 2);
  const doorY = h - doorH;
  p.rect(doorX, doorY, TILE, doorH, '0');
  p.rect(doorX + 1, doorY + 1, TILE - 2, doorH - 1, 'D');
  p.rect(doorX + 2, doorY + 3, TILE - 4, doorH - 6, 'd');
  p.set(doorX + TILE - 4, doorY + Math.floor(doorH / 2), 'i');

  // Plaque above the door, carrying the building's emblem colour.
  const plaqueY = doorY - 9;
  if (plaqueY > wallTop) {
    p.rect(doorX - 4, plaqueY, TILE + 8, 8, '0');
    p.rect(doorX - 3, plaqueY + 1, TILE + 6, 6, 'd');
    p.rect(doorX - 1, plaqueY + 2, TILE + 2, 4, spec.emblem);
  }

  return p;
}

/** Window x-positions that keep clear of the door. */
function windowPositions(w: number, doorX: number): number[] {
  const candidates = [Math.round(w * 0.16) - 6, Math.round(w * 0.84) - 6];
  return candidates.filter(
    (x) => x >= 3 && x + 12 <= w - 3 && (x + 12 < doorX - 4 || x > doorX + TILE + 4),
  );
}

// ---------------------------------------------------------------------------
// Interior furniture
// ---------------------------------------------------------------------------

/** A bed, two tiles wide and two tall. */
export function paintBed(): Px {
  const p = new Px(TILE * 2, TILE * 2);
  p.rect(1, 2, 30, 29, '0');
  p.rect(2, 3, 28, 27, 'd');
  // Pillow at the head.
  p.rect(4, 5, 24, 9, '5');
  p.rect(4, 5, 24, 1, '4');
  // Quilt.
  p.rect(4, 15, 24, 14, 'b');
  for (let y = 17; y < 29; y += 4) p.hline(4, y, 24, 'B');
  p.rect(4, 15, 24, 1, 'B');
  // Posts.
  p.rect(1, 29, 3, 3, 'D');
  p.rect(28, 29, 3, 3, 'D');
  return p;
}

/** A desk with a monitor — the one bit of the house that is clearly yours. */
export function paintDesk(): Px {
  const p = new Px(TILE * 2, TILE * 2);
  // Monitor.
  p.rect(6, 2, 20, 14, '0');
  p.rect(7, 3, 18, 12, '1');
  p.rect(8, 4, 16, 10, 'q');
  p.rect(8, 4, 16, 4, 'Q');
  p.rect(14, 16, 4, 3, 'M');
  p.rect(11, 19, 10, 2, 'M');
  // Desktop surface.
  p.rect(0, 21, 32, 4, 'D');
  p.rect(1, 21, 30, 2, 'd');
  // Legs.
  p.rect(2, 25, 3, 7, 'D');
  p.rect(27, 25, 3, 7, 'D');
  // Keyboard.
  p.rect(9, 25, 14, 3, '4');
  p.hline(9, 25, 14, '3');
  return p;
}

/** A bookshelf, two tiles wide and two tall. */
export function paintShelf(): Px {
  const p = new Px(TILE * 2, TILE * 2);
  p.rect(1, 0, 30, 32, '0');
  p.rect(2, 1, 28, 30, 'D');
  const spines = ['f', 'b', 'F', 't', 'q', 'r', 'i', 'w'];
  for (let shelf = 0; shelf < 3; shelf++) {
    const y = 3 + shelf * 10;
    p.rect(4, y, 24, 7, 'd');
    let x = 4;
    let i = shelf * 3;
    while (x < 27) {
      const width = 2 + ((i * 7) % 3);
      p.rect(x, y, Math.min(width, 27 - x), 7, spines[i % spines.length]!);
      x += width + 1;
      i++;
    }
    p.hline(3, y + 7, 26, 'D');
  }
  return p;
}

/** A rug, three tiles wide and two tall. Decorative, walkable. */
export function paintRug(): Px {
  const p = new Px(TILE * 3, TILE * 2);
  p.rect(0, 0, 48, 32, 'R');
  p.frame(0, 0, 48, 32, 'e');
  p.rect(4, 4, 40, 24, 'r');
  p.frame(4, 4, 40, 24, 'e');
  p.rect(10, 9, 28, 14, 'F');
  p.frame(10, 9, 28, 14, 'I');
  p.rect(18, 13, 12, 6, 'r');
  return p;
}

/** A potted plant. */
export function paintPlant(): Px {
  const p = new Px(TILE, TILE);
  p.rect(4, 10, 8, 6, '0');
  p.rect(5, 11, 6, 5, 'o');
  p.ellipse(8, 7, 5, 5, 'T');
  p.ellipse(7, 6, 3, 3, 't');
  p.vline(8, 7, 4, 'v');
  return p;
}

/** A side table with a lamp. */
export function paintTable(): Px {
  const p = new Px(TILE, TILE);
  p.rect(2, 4, 12, 3, 'D');
  p.rect(3, 4, 10, 1, 'd');
  p.rect(4, 7, 2, 8, 'D');
  p.rect(10, 7, 2, 8, 'D');
  p.rect(6, 0, 4, 4, 'F');
  p.rect(7, 1, 2, 2, '5');
  return p;
}

/**
 * The photo frame on the wall of your house: two tiles square, gilt-edged,
 * with a generic portrait silhouette inside. The real photograph appears in
 * the panel that opens when you interact with it — a photo cannot be
 * meaningfully represented in 32x32 pixels, and pretending otherwise would
 * just look like a smudge.
 */
export function paintPhotoFrame(): Px {
  const p = new Px(TILE * 2, TILE * 2);
  p.rect(2, 2, 28, 28, 'I');
  p.frame(2, 2, 28, 28, '0');
  p.rect(4, 4, 24, 24, 'i');
  p.rect(6, 6, 20, 20, '0');
  p.rect(7, 7, 18, 18, 'q');
  p.rect(7, 7, 18, 9, 'Q');
  // Portrait silhouette: head and shoulders.
  p.ellipse(16, 15, 4, 5, '1');
  p.ellipse(16, 25, 8, 6, '1');
  p.rect(7, 26, 18, 2, 'Q');
  // A glint across the glass.
  p.set(10, 9, '5').set(11, 10, '5').set(12, 11, '5');
  return p;
}

/** The doormat that warps you between the house and the town. */
export function paintMat(): Px {
  const p = new Px(TILE, TILE);
  p.rect(1, 4, 14, 10, 'o');
  p.frame(1, 4, 14, 10, 'D');
  p.rect(3, 6, 10, 6, 'P');
  for (let x = 4; x < 13; x += 2) p.vline(x, 6, 6, 'o');
  return p;
}

/** A service counter, three tiles wide — used in the Skill Centre lobby. */
export function paintCounter(): Px {
  const p = new Px(TILE * 3, TILE);
  p.rect(0, 2, 48, 12, '0');
  p.rect(1, 3, 46, 10, 'd');
  p.rect(1, 3, 46, 3, 'D');
  p.hline(1, 10, 46, 'D');
  return p;
}

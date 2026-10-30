/**
 * Ground tile semantics.
 *
 * The ground layer holds only surfaces — grass, path, water, floorboards,
 * walls. Everything with a silhouette (trees, signs, furniture, buildings)
 * is a placed object instead, because objects need to be depth-sorted
 * against the player and tiles never do.
 */

export const Tile = {
  Void: 0,
  GrassA: 1,
  GrassB: 2,
  GrassC: 3,
  TallGrass: 4,
  Path: 5,
  Sand: 6,
  Water: 7,
  FlowerRed: 8,
  FlowerYellow: 9,
  Floor: 10,
  FloorAlt: 11,
  Wall: 12,
  WallBase: 13,
} as const;

export type TileId = (typeof Tile)[keyof typeof Tile];

/** Tiles you cannot walk onto. Everything else is walkable. */
const SOLID = new Set<TileId>([Tile.Void, Tile.Water, Tile.Wall, Tile.WallBase]);

export function isSolidTile(tile: TileId): boolean {
  return SOLID.has(tile);
}

export function isWaterTile(tile: TileId): boolean {
  return tile === Tile.Water;
}

/** Tiles that rustle underfoot, used to pick the footstep sound. */
export function isGrassTile(tile: TileId): boolean {
  return (
    tile === Tile.GrassA ||
    tile === Tile.GrassB ||
    tile === Tile.GrassC ||
    tile === Tile.TallGrass ||
    tile === Tile.FlowerRed ||
    tile === Tile.FlowerYellow
  );
}

/**
 * Map authoring legend.
 *
 * Maps are written as arrays of strings using these characters, which means
 * a map is reviewable at a glance — you can see the shape of the town in the
 * source. A numeric grid of the same data would be unreadable and every
 * edit would be a guess.
 */
export const TILE_LEGEND: Record<string, TileId> = {
  ' ': Tile.Void,
  '.': Tile.GrassA, // plain grass; the exact variant is chosen per position
  ',': Tile.TallGrass,
  '#': Tile.Path,
  _: Tile.Sand,
  '~': Tile.Water,
  '*': Tile.FlowerRed,
  '+': Tile.FlowerYellow,
  '=': Tile.Floor,
  '-': Tile.FloorAlt,
  X: Tile.Wall,
  x: Tile.WallBase,
};

/**
 * Picks one of three grass variants from the tile's position. Hashing the
 * coordinates rather than calling random keeps the meadow stable across
 * reloads while still looking irregular.
 */
function grassVariant(x: number, y: number): TileId {
  const hash = (x * 73856093) ^ (y * 19349663);
  const pick = Math.abs(hash) % 3;
  return pick === 0 ? Tile.GrassA : pick === 1 ? Tile.GrassB : Tile.GrassC;
}

/** Turns authored map rows into a tile grid, padding short rows with void. */
export function parseGround(rows: string[]): TileId[][] {
  const width = rows.reduce((max, row) => Math.max(max, row.length), 0);
  return rows.map((row, y) => {
    const out: TileId[] = new Array(width);
    for (let x = 0; x < width; x++) {
      const ch = row[x] ?? ' ';
      const tile = TILE_LEGEND[ch];
      if (tile === undefined) {
        throw new Error(
          `[map] unknown tile character "${ch}" at (${x}, ${y}). ` +
            `Valid characters: ${Object.keys(TILE_LEGEND).join('')}`,
        );
      }
      out[x] = tile === Tile.GrassA ? grassVariant(x, y) : tile;
    }
    return out;
  });
}

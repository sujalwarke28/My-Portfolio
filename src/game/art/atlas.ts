import { Px, createSurface } from './draw.ts';
import { ROOF_TINTS, type BuildingKind, type TintMap } from './palette.ts';
import * as paint from './paint.ts';
import { buildCharacterFrames, NPC_PALETTES, SPRITE_W, SPRITE_H, type Facing } from './sprites.ts';
import { Tile, type TileId } from '../world/tiles.ts';

/**
 * Rasterises every piece of art into offscreen canvases once, at boot.
 *
 * Nothing is loaded over the network — the art is code, so this is the only
 * "asset pipeline" the project has. It costs a few tens of milliseconds,
 * which is why the spiral loader exists: it covers this work instead of the
 * player watching a blank screen.
 */

export const TILE = paint.TILE;
export const WATER_FRAMES = 4;

export type SpriteName =
  | 'tree'
  | 'tree2'
  | 'tree3'
  | 'bush'
  | 'rock'
  | 'fenceH'
  | 'fenceV'
  | 'sign'
  | 'lamp'
  | 'bed'
  | 'desk'
  | 'shelf'
  | 'rug'
  | 'plant'
  | 'table'
  | 'photoFrame'
  | 'mat'
  | 'counter'
  | `building:${BuildingKind}`;

/** Footprints and door positions, in tiles. */
export const BUILDING_SPECS: Record<BuildingKind, paint.BuildingSpec> = {
  home: { tilesW: 4, tilesH: 4, doorTx: 1, emblem: 'F' },
  skill: { tilesW: 6, tilesH: 5, doorTx: 2, emblem: '5' },
  story: { tilesW: 6, tilesH: 5, doorTx: 2, emblem: 'F' },
  project: { tilesW: 6, tilesH: 5, doorTx: 2, emblem: 'i' },
  contact: { tilesW: 5, tilesH: 4, doorTx: 2, emblem: '5' },
};

export interface Atlas {
  tile(id: TileId): HTMLCanvasElement;
  water(frame: number): HTMLCanvasElement;
  sprite(name: SpriteName): HTMLCanvasElement;
  character(look: string, facing: Facing, frame: number): HTMLCanvasElement;
}

/** Rasterises one pixel surface onto its own canvas. */
function bake(px: Px, tint?: TintMap): HTMLCanvasElement {
  const { canvas, ctx } = createSurface(px.w, px.h);
  px.paint(ctx, 0, 0, tint);
  return canvas;
}

export function buildAtlas(): Atlas {
  // --- Ground tiles ---
  const tiles = new Map<TileId, HTMLCanvasElement>();
  tiles.set(Tile.Void, bake(paint.paintVoid()));
  tiles.set(Tile.GrassA, bake(paint.paintGrass(11)));
  tiles.set(Tile.GrassB, bake(paint.paintGrass(29)));
  tiles.set(Tile.GrassC, bake(paint.paintGrass(47)));
  tiles.set(Tile.TallGrass, bake(paint.paintTallGrass(53)));
  tiles.set(Tile.Path, bake(paint.paintPath(67)));
  tiles.set(Tile.Sand, bake(paint.paintSand(71)));
  tiles.set(Tile.FlowerRed, bake(paint.paintFlowers(83, 'f')));
  tiles.set(Tile.FlowerYellow, bake(paint.paintFlowers(97, 'F')));
  tiles.set(Tile.Floor, bake(paint.paintFloor(101)));
  tiles.set(Tile.FloorAlt, bake(paint.paintFloor(113)));
  tiles.set(Tile.Wall, bake(paint.paintWall()));
  tiles.set(Tile.WallBase, bake(paint.paintWallBase()));

  // Water animates, so its frames live in their own list. The tile map still
  // needs an entry for it in case something bakes a static snapshot.
  const water: HTMLCanvasElement[] = [];
  for (let f = 0; f < WATER_FRAMES; f++) water.push(bake(paint.paintWater(f)));
  tiles.set(Tile.Water, water[0]!);

  // --- Objects ---
  const sprites = new Map<SpriteName, HTMLCanvasElement>();
  sprites.set('tree', bake(paint.paintTree(0)));
  sprites.set('tree2', bake(paint.paintTree(1)));
  sprites.set('tree3', bake(paint.paintTree(2)));
  sprites.set('bush', bake(paint.paintBush()));
  sprites.set('rock', bake(paint.paintRock()));
  sprites.set('fenceH', bake(paint.paintFence('h')));
  sprites.set('fenceV', bake(paint.paintFence('v')));
  sprites.set('sign', bake(paint.paintSign()));
  sprites.set('lamp', bake(paint.paintLamp()));
  sprites.set('bed', bake(paint.paintBed()));
  sprites.set('desk', bake(paint.paintDesk()));
  sprites.set('shelf', bake(paint.paintShelf()));
  sprites.set('rug', bake(paint.paintRug()));
  sprites.set('plant', bake(paint.paintPlant()));
  sprites.set('table', bake(paint.paintTable()));
  sprites.set('photoFrame', bake(paint.paintPhotoFrame()));
  sprites.set('mat', bake(paint.paintMat()));
  sprites.set('counter', bake(paint.paintCounter()));

  // One building surface per kind, each rasterised through its own tint map.
  for (const kind of Object.keys(BUILDING_SPECS) as BuildingKind[]) {
    const surface = paint.paintBuilding(BUILDING_SPECS[kind]);
    sprites.set(`building:${kind}`, bake(surface, ROOF_TINTS[kind]));
  }

  // --- Characters ---
  const frames = buildCharacterFrames();
  const characters = new Map<string, HTMLCanvasElement>();
  const facings: Facing[] = ['down', 'up', 'left', 'right'];

  const bakeLook = (look: string, recolor?: Record<string, string>) => {
    for (const facing of facings) {
      frames[facing].forEach((frame, i) => {
        const surface = recolor ? frame.recolored(recolor) : frame;
        characters.set(`${look}:${facing}:${i}`, bake(surface));
      });
    }
  };

  bakeLook('player');
  for (const [look, recolor] of Object.entries(NPC_PALETTES)) bakeLook(look, recolor);

  // --- Lookups ---
  const blank = bake(new Px(TILE, TILE));
  const blankChar = bake(new Px(SPRITE_W, SPRITE_H));

  return {
    tile: (id) => tiles.get(id) ?? blank,
    water: (frame) => water[((frame % WATER_FRAMES) + WATER_FRAMES) % WATER_FRAMES]!,
    sprite: (name) => {
      const found = sprites.get(name);
      if (!found) throw new Error(`[atlas] no sprite named "${name}"`);
      return found;
    },
    character: (look, facing, frame) =>
      characters.get(`${look}:${facing}:${frame & 3}`) ??
      characters.get(`player:${facing}:0`) ??
      blankChar,
  };
}

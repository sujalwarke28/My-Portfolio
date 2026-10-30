import { OBJECT_DEFS, sceneHeight, sceneWidth, type Scene } from './scenes.ts';
import { Tile, type TileId } from './world/tiles.ts';

/**
 * Shared map rendering for the always-on minimap in the corner and the
 * full-screen map on M. Both are the same picture at different cell sizes,
 * so they can never disagree about where anything is.
 *
 * Colours are flattened, not sampled from the tile art: a minimap needs
 * legible blocks of terrain, and averaging the speckled grass texture would
 * produce a muddy wash where the paths disappear.
 */
const TILE_COLORS: Record<TileId, string> = {
  [Tile.Void]: '#10101c',
  [Tile.GrassA]: '#4c9038',
  [Tile.GrassB]: '#4c9038',
  [Tile.GrassC]: '#51953c',
  [Tile.TallGrass]: '#38702c',
  [Tile.Path]: '#d8c088',
  [Tile.Sand]: '#c4ac78',
  [Tile.Water]: '#3878c8',
  [Tile.FlowerRed]: '#5a9a44',
  [Tile.FlowerYellow]: '#5a9a44',
  [Tile.Floor]: '#b08048',
  [Tile.FloorAlt]: '#a0703c',
  [Tile.Wall]: '#d4c0a0',
  [Tile.WallBase]: '#a89478',
};

const TREE_COLOR = '#1f4c20';
const OBJECT_COLOR = '#2b2b40';

/**
 * Draws a scene's terrain and scenery. Buildings are drawn in their marker
 * colour so each one is identifiable at a glance — the whole point of the
 * corner map is answering "which blob am I heading for".
 */
export function bakeMinimap(scene: Scene, cell: number): HTMLCanvasElement {
  const w = sceneWidth(scene);
  const h = sceneHeight(scene);
  const canvas = document.createElement('canvas');
  canvas.width = w * cell;
  canvas.height = h * cell;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = false;

  for (let ty = 0; ty < h; ty++) {
    const row = scene.ground[ty]!;
    for (let tx = 0; tx < row.length; tx++) {
      ctx.fillStyle = TILE_COLORS[row[tx]!] ?? '#10101c';
      ctx.fillRect(tx * cell, ty * cell, cell, cell);
    }
  }

  // Scenery, so the treeline reads as a boundary rather than open grass.
  for (const placed of scene.objects) {
    const def = OBJECT_DEFS[placed.kind];
    if (def.flat || !def.solid) continue;
    const isBuilding = placed.kind.endsWith('Building');
    if (isBuilding) continue;
    const woodland = placed.kind.startsWith('tree') || placed.kind === 'bush';
    ctx.fillStyle = woodland ? TREE_COLOR : OBJECT_COLOR;
    const { dx, dy, w: rw, h: rh } = def.solid;
    ctx.fillRect((placed.tx + dx) * cell, (placed.ty + dy) * cell, rw * cell, rh * cell);
  }

  // Buildings last and in colour, so nothing is drawn over them.
  for (const placed of scene.objects) {
    const def = OBJECT_DEFS[placed.kind];
    if (!placed.kind.endsWith('Building') || !def.solid) continue;
    const marker = scene.markers.find(
      (m) =>
        m.tx >= placed.tx &&
        m.tx < placed.tx + def.solid!.w &&
        m.ty >= placed.ty &&
        m.ty < placed.ty + def.solid!.h,
    );
    ctx.fillStyle = marker?.color ?? '#f4f4f8';
    const { dx, dy, w: rw, h: rh } = def.solid;
    ctx.fillRect((placed.tx + dx) * cell, (placed.ty + dy) * cell, rw * cell, rh * cell);
    ctx.fillStyle = 'rgba(16, 16, 28, 0.55)';
    ctx.fillRect((placed.tx + dx) * cell, (placed.ty + dy + rh - 1) * cell, rw * cell, cell);
  }

  return canvas;
}

export function minimapSize(scene: Scene, cell: number): { w: number; h: number } {
  return { w: sceneWidth(scene) * cell, h: sceneHeight(scene) * cell };
}

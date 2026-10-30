import { createSurface } from './art/draw.ts';
import { TILE, WATER_FRAMES, type Atlas } from './art/atlas.ts';
import { OBJECT_DEFS, sceneHeight, sceneWidth, type Scene } from './scenes.ts';
import { isWaterTile, Tile } from './world/tiles.ts';
import type { Camera } from './camera.ts';
import type { GridMover } from './player.ts';
import type { Npc } from './npc.ts';

/**
 * The GBA's own resolution, used as the *minimum* viewport rather than a
 * fixed one. A fixed 240x160 letterboxed into a modern monitor wastes most
 * of the screen; growing the viewport while keeping the scale an integer
 * shows a little more of the town instead, and keeps every pixel square.
 */
const MIN_W = 240;
const MIN_H = 160;
/**
 * Caps on how much of the map can be on screen at once. Without these, a
 * tall phone or an ultrawide monitor would zoom out until the character was
 * a speck.
 */
const MAX_W = 400;
const MAX_H = 272;

/**
 * Phones get a smaller minimum viewport, which lets the integer scale go
 * *up*.
 *
 * Holding a 240px-wide minimum on a 390px-wide phone forces a scale of 4,
 * and a 16px-wide character then measures about 21 CSS pixels — too small
 * to read at arm's length. Asking for only 176px of world lets the same
 * phone use a scale of 6, and the character lands at a comfortable 32.
 */
const NARROW_BREAKPOINT = 560;
const NARROW_MIN_W = 176;
const NARROW_MIN_H = 144;
const NARROW_MAX_W = 256;
const NARROW_MAX_H = 288;

const LABEL_RANGE_TILES = 6;

/** The worn rim where a path meets grass. */
const PATH_EDGE = '#a08858';
/** Foam where water meets land. */
const SHORE = '#8ad0f0';

/** Fills alternate pixels, giving a hard edge a softer, hand-placed look. */
function ditherRow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  length: number,
  phase: number,
): void {
  for (let i = phase & 1; i < length; i += 2) ctx.fillRect(x + i, y, 1, 1);
}

function ditherColumn(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  length: number,
  phase: number,
): void {
  for (let i = phase & 1; i < length; i += 2) ctx.fillRect(x, y + i, 1, 1);
}

/**
 * A highlight on roughly one water tile in eleven, at a position that moves
 * with the animation frame.
 */
function sparkleAt(tx: number, ty: number, frame: number): [number, number] | null {
  const hash = ((tx * 73856093) ^ (ty * 19349663) ^ (frame * 83492791)) >>> 0;
  if (hash % 11 !== 0) return null;
  return [(hash >>> 4) % TILE, (hash >>> 9) % TILE];
}

/** Bitmask of the sides on which a water tile meets something that is not water. */
function shoreMask(scene: Scene, tx: number, ty: number): number {
  const dry = (x: number, y: number) => {
    const tile = scene.ground[y]?.[x];
    return tile !== undefined && tile !== Tile.Water;
  };
  return (
    (dry(tx, ty - 1) ? 1 : 0) |
    (dry(tx, ty + 1) ? 2 : 0) |
    (dry(tx - 1, ty) ? 4 : 0) |
    (dry(tx + 1, ty) ? 8 : 0)
  );
}

export interface FrameState {
  scene: Scene;
  camera: Camera;
  player: GridMover;
  npcs: Npc[];
  /** Milliseconds since boot, for tile animation. */
  time: number;
}

interface Drawable {
  canvas: HTMLCanvasElement;
  x: number;
  y: number;
  /** World-pixel Y of the item's base, used for depth sorting. */
  anchor: number;
}

export class Renderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly atlas: Atlas;

  /** The low-resolution surface everything is actually drawn onto. */
  private internal: HTMLCanvasElement;
  private internalCtx: CanvasRenderingContext2D;

  viewW = MIN_W;
  viewH = MIN_H;
  private scale = 1;

  /** The whole scene's static ground, baked once on scene change. */
  private ground: HTMLCanvasElement | null = null;
  /** Visible water tiles, each with a bitmask of which sides meet land. */
  private waterTiles: Array<[number, number, number]> = [];
  private fontReady = false;

  constructor(canvas: HTMLCanvasElement, atlas: Atlas) {
    this.canvas = canvas;
    this.atlas = atlas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('2D canvas context unavailable');
    this.ctx = ctx;
    const surface = createSurface(MIN_W, MIN_H);
    this.internal = surface.canvas;
    this.internalCtx = surface.ctx;
  }

  /** Pixel fonts render as garbage until the face is actually loaded. */
  async waitForFont(): Promise<void> {
    try {
      await document.fonts.load('8px "Press Start 2P"');
      await document.fonts.ready;
      this.fontReady = true;
    } catch {
      this.fontReady = false;
    }
  }

  /**
   * Recomputes the integer scale and the internal viewport for the current
   * element size. Called on mount and on every resize.
   */
  resize(): void {
    const parent = this.canvas.parentElement;
    const cssW = Math.max(1, parent?.clientWidth ?? window.innerWidth);
    const cssH = Math.max(1, parent?.clientHeight ?? window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const deviceW = cssW * dpr;
    const deviceH = cssH * dpr;

    const narrow = cssW < NARROW_BREAKPOINT;
    const minW = narrow ? NARROW_MIN_W : MIN_W;
    const minH = narrow ? NARROW_MIN_H : MIN_H;
    const maxW = narrow ? NARROW_MAX_W : MAX_W;
    const maxH = narrow ? NARROW_MAX_H : MAX_H;

    this.scale = Math.max(1, Math.floor(Math.min(deviceW / minW, deviceH / minH)));
    this.viewW = Math.min(maxW, Math.max(minW, Math.floor(deviceW / this.scale)));
    this.viewH = Math.min(maxH, Math.max(minH, Math.floor(deviceH / this.scale)));

    if (this.internal.width !== this.viewW || this.internal.height !== this.viewH) {
      this.internal.width = this.viewW;
      this.internal.height = this.viewH;
      this.internalCtx.imageSmoothingEnabled = false;
    }

    const drawnW = this.viewW * this.scale;
    const drawnH = this.viewH * this.scale;
    this.canvas.width = drawnW;
    this.canvas.height = drawnH;
    // The element is sized to exactly what was drawn, so the browser never
    // resamples the backing store. Any leftover space is absorbed by the
    // container, which shares the canvas's background colour.
    this.canvas.style.width = `${drawnW / dpr}px`;
    this.canvas.style.height = `${drawnH / dpr}px`;
    this.ctx.imageSmoothingEnabled = false;
  }

  /**
   * Bakes a scene's ground layer into one big canvas.
   *
   * This is the single biggest rendering win in the project: instead of
   * ~400 drawImage calls a frame for ground tiles, there is one. Water is
   * excluded and redrawn live, and flat objects (rugs, doormats) are baked
   * in because they never move and never need depth sorting.
   */
  setScene(scene: Scene): void {
    const w = sceneWidth(scene) * TILE;
    const h = sceneHeight(scene) * TILE;
    const { canvas, ctx } = createSurface(w, h);
    this.waterTiles = [];

    for (let ty = 0; ty < sceneHeight(scene); ty++) {
      const row = scene.ground[ty]!;
      for (let tx = 0; tx < row.length; tx++) {
        const tile = row[tx]!;
        ctx.drawImage(this.atlas.tile(tile), tx * TILE, ty * TILE);
        if (isWaterTile(tile)) {
          this.waterTiles.push([tx, ty, shoreMask(scene, tx, ty)]);
        }
      }
    }

    this.paintPathEdges(ctx, scene);

    for (const placed of scene.objects) {
      if (!OBJECT_DEFS[placed.kind].flat) continue;
      ctx.drawImage(
        this.atlas.sprite(OBJECT_DEFS[placed.kind].sprite),
        placed.tx * TILE,
        placed.ty * TILE,
      );
    }

    this.ground = canvas;
  }

  /**
   * Draws a worn border wherever a path or the plaza meets grass.
   *
   * Without it the terrain reads as flat blocks of colour butted together,
   * which is the single thing that most makes a tile map look like a
   * spreadsheet rather than a place. A proper autotiled tileset would be the
   * thorough fix; a darker rim with one dithered row costs a few lines at
   * bake time and gets most of the way there.
   */
  private paintPathEdges(ctx: CanvasRenderingContext2D, scene: Scene): void {
    const width = sceneWidth(scene);
    const height = sceneHeight(scene);
    const isSoft = (tx: number, ty: number): boolean => {
      const tile = scene.ground[ty]?.[tx];
      return tile === Tile.Path || tile === Tile.Sand;
    };

    ctx.fillStyle = PATH_EDGE;
    for (let ty = 0; ty < height; ty++) {
      for (let tx = 0; tx < width; tx++) {
        if (!isSoft(tx, ty)) continue;
        const px = tx * TILE;
        const py = ty * TILE;

        if (!isSoft(tx, ty - 1)) {
          ctx.fillRect(px, py, TILE, 2);
          ditherRow(ctx, px, py + 2, TILE, tx);
        }
        if (!isSoft(tx, ty + 1)) {
          ctx.fillRect(px, py + TILE - 2, TILE, 2);
          ditherRow(ctx, px, py + TILE - 3, TILE, tx + 1);
        }
        if (!isSoft(tx - 1, ty)) {
          ctx.fillRect(px, py, 2, TILE);
          ditherColumn(ctx, px + 2, py, TILE, ty);
        }
        if (!isSoft(tx + 1, ty)) {
          ctx.fillRect(px + TILE - 2, py, 2, TILE);
          ditherColumn(ctx, px + TILE - 3, py, TILE, ty + 1);
        }
      }
    }
  }

  draw(state: FrameState): void {
    const { scene, camera, player, npcs, time } = state;
    const ctx = this.internalCtx;
    const camX = Math.round(camera.x);
    const camY = Math.round(camera.y);

    ctx.fillStyle = '#10101c';
    ctx.fillRect(0, 0, this.viewW, this.viewH);

    this.drawGround(camX, camY);
    this.drawWater(camX, camY, time);
    this.drawEntities(scene, camX, camY, player, npcs);
    this.drawLabels(scene, camX, camY, player);

    if (scene.indoor) {
      // A faint warm wash. Indoors should read as lamplight rather than as
      // the same open daylight as the town.
      ctx.fillStyle = 'rgba(255, 196, 120, 0.07)';
      ctx.fillRect(0, 0, this.viewW, this.viewH);
    }

    this.ctx.drawImage(
      this.internal,
      0,
      0,
      this.viewW,
      this.viewH,
      0,
      0,
      this.viewW * this.scale,
      this.viewH * this.scale,
    );
  }

  private drawGround(camX: number, camY: number): void {
    const ground = this.ground;
    if (!ground) return;
    // Clipped manually because a negative source rectangle (which happens
    // when a map is smaller than the viewport and gets centred) is not
    // portable across browsers.
    let sx = camX;
    let sy = camY;
    let dx = 0;
    let dy = 0;
    let sw = this.viewW;
    let sh = this.viewH;
    if (sx < 0) {
      dx = -sx;
      sw += sx;
      sx = 0;
    }
    if (sy < 0) {
      dy = -sy;
      sh += sy;
      sy = 0;
    }
    sw = Math.min(sw, ground.width - sx);
    sh = Math.min(sh, ground.height - sy);
    if (sw <= 0 || sh <= 0) return;
    this.internalCtx.drawImage(ground, sx, sy, sw, sh, dx, dy, sw, sh);
  }

  private drawWater(camX: number, camY: number, time: number): void {
    if (this.waterTiles.length === 0) return;
    // ~5fps: the GBA's water was a lazy drift, not a ripple.
    const frame = Math.floor(time / 200) % WATER_FRAMES;
    const sprite = this.atlas.water(frame);
    const ctx = this.internalCtx;
    const minTx = Math.floor(camX / TILE) - 1;
    const maxTx = Math.ceil((camX + this.viewW) / TILE) + 1;
    const minTy = Math.floor(camY / TILE) - 1;
    const maxTy = Math.ceil((camY + this.viewH) / TILE) + 1;

    for (const [tx, ty, shore] of this.waterTiles) {
      if (tx < minTx || tx > maxTx || ty < minTy || ty > maxTy) continue;
      const px = tx * TILE - camX;
      const py = ty * TILE - camY;
      ctx.drawImage(sprite, px, py);

      // The shoreline is drawn here rather than baked, because the animated
      // water tile is painted over the baked ground every frame and would
      // cover anything underneath it.
      // Scattered per position and reseeded each frame, so the highlights
      // twinkle across the pond instead of repeating on a 16px grid.
      const sparkle = sparkleAt(tx, ty, frame);
      if (sparkle) {
        ctx.fillStyle = '#f4f4f8';
        ctx.fillRect(px + sparkle[0], py + sparkle[1], 1, 1);
      }

      if (shore === 0) continue;
      ctx.fillStyle = SHORE;
      if (shore & 1) ctx.fillRect(px, py, TILE, 2);
      if (shore & 2) ctx.fillRect(px, py + TILE - 2, TILE, 2);
      if (shore & 4) ctx.fillRect(px, py, 2, TILE);
      if (shore & 8) ctx.fillRect(px + TILE - 2, py, 2, TILE);
    }
  }

  /**
   * Draws scenery and characters in one depth-sorted pass, so the player
   * walks behind a tree canopy or a roof and in front of its base without
   * any special casing.
   */
  private drawEntities(
    scene: Scene,
    camX: number,
    camY: number,
    player: GridMover,
    npcs: Npc[],
  ): void {
    const drawables: Drawable[] = [];
    // Generous margin: a building is five tiles tall and must still be drawn
    // when its base is below the bottom of the screen.
    const left = camX - TILE * 8;
    const right = camX + this.viewW + TILE * 8;
    const top = camY - TILE * 8;
    const bottom = camY + this.viewH + TILE * 8;

    for (const placed of scene.objects) {
      const def = OBJECT_DEFS[placed.kind];
      if (def.flat) continue;
      const sprite = this.atlas.sprite(def.sprite);
      const x = placed.tx * TILE;
      const y = placed.ty * TILE;
      if (x + sprite.width < left || x > right || y + sprite.height < top || y > bottom) continue;
      drawables.push({ canvas: sprite, x, y, anchor: y + sprite.height });
    }

    for (const npc of npcs) {
      const sprite = this.atlas.character(npc.spec.look, npc.facing, npc.animFrame);
      drawables.push({
        canvas: sprite,
        x: npc.px,
        // Characters are 24px tall standing on a 16px tile, so they are
        // lifted by the 8px difference to put their feet on the ground.
        y: npc.py - (sprite.height - TILE),
        anchor: npc.py + TILE,
      });
    }

    const playerSprite = this.atlas.character('player', player.facing, player.animFrame);
    drawables.push({
      canvas: playerSprite,
      x: player.px,
      y: player.py - (playerSprite.height - TILE),
      anchor: player.py + TILE,
    });

    drawables.sort((a, b) => a.anchor - b.anchor);
    for (const item of drawables) {
      this.internalCtx.drawImage(item.canvas, Math.round(item.x - camX), Math.round(item.y - camY));
    }
  }

  /**
   * Building nameplates, drawn in the world when the player is close.
   *
   * These are drawn on the canvas rather than as positioned DOM elements for
   * a specific reason: a DOM label has to be repositioned every frame as the
   * camera moves, which means a React render (or a direct style write) at
   * 60fps for each label. Canvas text costs nothing extra and stays inside
   * the pixel grid with the rest of the art.
   */
  private drawLabels(scene: Scene, camX: number, camY: number, player: GridMover): void {
    const ctx = this.internalCtx;
    ctx.font = this.fontReady ? '8px "Press Start 2P", monospace' : 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (const placed of scene.objects) {
      if (!placed.label) continue;
      const def = OBJECT_DEFS[placed.kind];
      const rect = def.solid ?? { dx: 0, dy: 0, w: 1, h: 1 };
      const centreTx = placed.tx + rect.dx + rect.w / 2;
      const baseTy = placed.ty + rect.dy + rect.h;
      const distance = Math.hypot(centreTx - 0.5 - player.tx, baseTy - player.ty);
      if (distance > LABEL_RANGE_TILES) continue;

      // Fades in over the last tile of approach so plates do not pop.
      const alpha = Math.min(1, (LABEL_RANGE_TILES - distance) / 1.5);
      const x = Math.round(centreTx * TILE - camX);
      // Clamped to the top of the view. A five-tile-tall building standing
      // right in front of the player has its roof off-screen, and a plate
      // drawn relative to it would never be seen.
      const y = Math.max(4, Math.round((placed.ty + rect.dy) * TILE - camY - 12));
      const width = ctx.measureText(placed.label).width;

      ctx.globalAlpha = alpha * 0.85;
      ctx.fillStyle = '#10101c';
      ctx.fillRect(Math.round(x - width / 2) - 4, y - 3, Math.round(width) + 8, 14);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#f4f4f8';
      ctx.fillText(placed.label, x, y + 1);
      ctx.globalAlpha = 1;
    }

    ctx.textAlign = 'left';
  }

  /** Maps a click on the canvas element to a world-pixel position. */
  screenToWorld(cssX: number, cssY: number, camera: Camera): [number, number] {
    const rect = this.canvas.getBoundingClientRect();
    const internalX = (cssX / Math.max(1, rect.width)) * this.viewW;
    const internalY = (cssY / Math.max(1, rect.height)) * this.viewH;
    return [internalX + camera.x, internalY + camera.y];
  }
}

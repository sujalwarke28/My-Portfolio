import { colorOf, type TintMap } from './palette.ts';

/**
 * A tiny pixel-art drawing surface.
 *
 * Art in this project is authored two ways, and this class serves both:
 * geometric things (tiles, buildings, furniture) are *drawn* with these
 * primitives, because reasoning about a roof as "a stack of narrowing rows"
 * beats counting characters in a 64-wide string; organic things (characters)
 * are authored as literal pixel strings and loaded with `fromRows`.
 *
 * Cells hold palette characters, not colours, so a whole sprite can be
 * retinted at paint time.
 */
export class Px {
  readonly w: number;
  readonly h: number;
  private readonly cells: string[];

  constructor(w: number, h: number, fill = '.') {
    this.w = w;
    this.h = h;
    this.cells = new Array<string>(w * h).fill(fill);
  }

  /**
   * Builds a surface from literal pixel rows. Rows shorter than the widest
   * row are padded with transparent cells, so trailing whitespace never has
   * to be counted — only the shape that matters needs to be exact.
   */
  static fromRows(rows: string[]): Px {
    const w = rows.reduce((max, row) => Math.max(max, row.length), 0);
    const px = new Px(w, rows.length);
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) px.set(x, y, row[x]!);
    });
    return px;
  }

  set(x: number, y: number, ch: string): this {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return this;
    this.cells[y * this.w + x] = ch;
    return this;
  }

  get(x: number, y: number): string {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return '.';
    return this.cells[y * this.w + x]!;
  }

  fill(ch: string): this {
    this.cells.fill(ch);
    return this;
  }

  rect(x: number, y: number, w: number, h: number, ch: string): this {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) this.set(x + dx, y + dy, ch);
    }
    return this;
  }

  /** Hollow rectangle, one pixel thick. */
  frame(x: number, y: number, w: number, h: number, ch: string): this {
    this.hline(x, y, w, ch);
    this.hline(x, y + h - 1, w, ch);
    this.vline(x, y, h, ch);
    this.vline(x + w - 1, y, h, ch);
    return this;
  }

  hline(x: number, y: number, len: number, ch: string): this {
    for (let i = 0; i < len; i++) this.set(x + i, y, ch);
    return this;
  }

  vline(x: number, y: number, len: number, ch: string): this {
    for (let i = 0; i < len; i++) this.set(x, y + i, ch);
    return this;
  }

  /** Filled ellipse — used for tree canopies and bushes. */
  ellipse(cx: number, cy: number, rx: number, ry: number, ch: string): this {
    for (let y = -ry; y <= ry; y++) {
      for (let x = -rx; x <= rx; x++) {
        if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1.04) {
          this.set(Math.round(cx + x), Math.round(cy + y), ch);
        }
      }
    }
    return this;
  }

  /**
   * Scatters characters deterministically. Seeded rather than random so a
   * grass tile looks identical on every load and across every client — an
   * unseeded speckle would make the town shimmer between reloads.
   */
  speckle(seed: number, chars: string[], count: number): this {
    const rand = mulberry32(seed);
    for (let i = 0; i < count; i++) {
      const x = Math.floor(rand() * this.w);
      const y = Math.floor(rand() * this.h);
      const ch = chars[Math.floor(rand() * chars.length)]!;
      this.set(x, y, ch);
    }
    return this;
  }

  /** Copies another surface in, skipping its transparent cells. */
  blit(src: Px, ox: number, oy: number): this {
    for (let y = 0; y < src.h; y++) {
      for (let x = 0; x < src.w; x++) {
        const ch = src.get(x, y);
        if (ch !== '.' && ch !== ' ') this.set(ox + x, oy + y, ch);
      }
    }
    return this;
  }

  /** Mirrors horizontally — how the opposite-leg walk frames are derived. */
  mirrored(): Px {
    const out = new Px(this.w, this.h);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) out.set(this.w - 1 - x, y, this.get(x, y));
    }
    return out;
  }

  /** Returns a copy with characters substituted — used for NPC recolours. */
  recolored(map: Record<string, string>): Px {
    const out = new Px(this.w, this.h);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const ch = this.get(x, y);
        out.set(x, y, map[ch] ?? ch);
      }
    }
    return out;
  }

  /** Rasterises onto a real canvas at 1 cell = 1 device pixel. */
  paint(ctx: CanvasRenderingContext2D, ox = 0, oy = 0, tint?: TintMap): void {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const color = colorOf(this.get(x, y), tint);
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(ox + x, oy + y, 1, 1);
      }
    }
  }
}

/** Small, fast, well-distributed seeded PRNG. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Creates an offscreen canvas with image smoothing already disabled. */
export function createSurface(w: number, h: number): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

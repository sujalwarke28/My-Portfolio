import { useEffect, useRef } from 'react';
import { buildCharacterFrames, type Facing } from '../game/art/sprites.ts';
import { createSurface } from '../game/art/draw.ts';

/**
 * The player's sprite, outside the game canvas.
 *
 * Used on the hero screen and in the tutorial, where the world is not
 * running yet. It rasterises the same pixel data the world uses rather than
 * referencing an image, so the character on the title screen can never get
 * out of sync with the one you walk around with.
 */

let cache: Partial<Record<Facing, HTMLCanvasElement[]>> = {};

function framesFor(facing: Facing): HTMLCanvasElement[] {
  const cached = cache[facing];
  if (cached) return cached;
  const built = buildCharacterFrames()[facing].map((px) => {
    const { canvas, ctx } = createSurface(px.w, px.h);
    px.paint(ctx);
    return canvas;
  });
  cache = { ...cache, [facing]: built };
  return built;
}

interface Props {
  /** Pixel scale factor. 4 gives a 64x96 character. */
  scale?: number;
  facing?: Facing;
  /** Walks on the spot when true. */
  animate?: boolean;
  className?: string;
}

export function PixelCharacter({
  scale = 4,
  facing = 'down',
  animate = false,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const frames = framesFor(facing);
    const first = frames[0]!;
    canvas.width = first.width * scale;
    canvas.height = first.height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let raf = 0;
    let index = 0;
    let last = 0;

    const paint = (frame: HTMLCanvasElement) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
    };

    paint(first);
    if (!animate) return;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      // ~7fps, the cadence of the original four-frame walk cycles.
      if (now - last < 145) return;
      last = now;
      index = (index + 1) % frames.length;
      paint(frames[index]!);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scale, facing, animate]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}

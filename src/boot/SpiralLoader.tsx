import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../state/storage.ts';

/**
 * The boot loader: a spinning spiral of pixel blocks.
 *
 * This is doing real work, not theatre. Building the sprite atlas rasterises
 * every tile, building and character in the game, and loading the pixel font
 * is a network round trip. That is a few hundred milliseconds where the
 * screen would otherwise be blank, so it gets covered with something that
 * sets the tone.
 */

const POINTS = 54;
const BLOCK = 7;

export function SpiralLoader({ label = 'LOADING' }: { label?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = 180;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.scale(dpr, dpr);

    const centre = size / 2;
    const reduced = prefersReducedMotion();

    // An Archimedean spiral: radius grows linearly with angle, so the blocks
    // stay evenly spaced along the arm instead of bunching at the centre.
    const points = Array.from({ length: POINTS }, (_, i) => {
      const t = i / (POINTS - 1);
      const angle = t * Math.PI * 4.5;
      const radius = 10 + t * 70;
      return {
        x: centre + Math.cos(angle) * radius,
        y: centre + Math.sin(angle) * radius,
      };
    });

    let raf = 0;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, size, size);
      const head = reduced ? 0 : (now / 900) % 1;

      points.forEach((point, i) => {
        const t = i / (POINTS - 1);
        // Distance from the travelling highlight, wrapped, so the glow runs
        // along the arm continuously rather than snapping back at the end.
        let delta = t - head;
        if (delta < 0) delta += 1;
        const glow = Math.max(0, 1 - delta * 4.5);
        const base = 0.22 + t * 0.2;
        ctx.globalAlpha = Math.min(1, base + glow * 0.95);
        ctx.fillStyle = glow > 0.55 ? '#f0c040' : '#58a8e8';
        const scale = BLOCK * (0.6 + t * 0.7);
        ctx.fillRect(
          Math.round(point.x - scale / 2),
          Math.round(point.y - scale / 2),
          Math.round(scale),
          Math.round(scale),
        );
      });
      ctx.globalAlpha = 1;
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-ink"
      role="status"
      aria-live="polite"
    >
      <canvas ref={canvasRef} aria-hidden="true" />
      <p className="font-pixel text-[11px] tracking-[0.3em] text-blue-light anim-blink">{label}</p>
    </div>
  );
}

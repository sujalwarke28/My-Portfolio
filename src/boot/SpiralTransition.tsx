import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { prefersReducedMotion } from '../state/storage.ts';

/**
 * The screen wipe.
 *
 * A rectangular inward spiral of blocks fills the screen, the world changes
 * behind it, and the spiral unwinds again. It is the same component for
 * every transition in the game — doors, warps and fast travel — which is
 * what makes the whole thing feel like one piece of software rather than
 * three separate effects.
 *
 * Drawn on a canvas rather than built from DOM nodes: a 30x20 grid is 600
 * elements, and animating 600 nodes' opacity is exactly the kind of thing
 * that drops frames on a phone. One canvas and 600 fillRects does not.
 */

export interface SpiralHandle {
  /** Covers the screen, runs `atBlackout`, then uncovers. */
  play(atBlackout: () => void): void;
}

const CELL_CSS = 26;
const HOLD_MS = 110;

/** Cell indices in inward-spiral order, clockwise from the top-left. */
function spiralOrder(cols: number, rows: number): Int32Array {
  const order = new Int32Array(cols * rows);
  let at = 0;
  let top = 0;
  let bottom = rows - 1;
  let left = 0;
  let right = cols - 1;

  while (top <= bottom && left <= right) {
    for (let x = left; x <= right; x++) order[at++] = top * cols + x;
    top++;
    for (let y = top; y <= bottom; y++) order[at++] = y * cols + right;
    right--;
    if (top <= bottom) {
      for (let x = right; x >= left; x--) order[at++] = bottom * cols + x;
      bottom--;
    }
    if (left <= right) {
      for (let y = bottom; y >= top; y--) order[at++] = y * cols + left;
      left++;
    }
  }
  return order;
}

export const SpiralTransition = forwardRef<SpiralHandle>(function SpiralTransition(_props, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(false);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  useImperativeHandle(ref, () => ({
    play(atBlackout: () => void) {
      const canvas = canvasRef.current;
      if (!canvas) {
        atBlackout();
        return;
      }
      // Overlapping wipes would fight over the canvas, and the second one's
      // world change would happen while the first was still uncovering.
      if (runningRef.current) {
        atBlackout();
        return;
      }
      runningRef.current = true;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = window.innerWidth;
      const cssH = window.innerHeight;
      canvas.width = Math.ceil(cssW * dpr);
      canvas.height = Math.ceil(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      canvas.style.display = 'block';

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        atBlackout();
        runningRef.current = false;
        canvas.style.display = 'none';
        return;
      }

      const cell = CELL_CSS * dpr;
      const cols = Math.ceil(canvas.width / cell);
      const rows = Math.ceil(canvas.height / cell);
      const order = spiralOrder(cols, rows);
      const total = order.length;

      const reduced = prefersReducedMotion();
      const sweepMs = reduced ? 140 : 420;

      let start = 0;
      let phase: 'cover' | 'hold' | 'uncover' = 'cover';
      let fired = false;

      const drawCovered = (count: number) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#10101c';
        for (let i = 0; i < count; i++) {
          const index = order[i]!;
          const x = (index % cols) * cell;
          const y = Math.floor(index / cols) * cell;
          ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(cell), Math.ceil(cell));
        }
      };

      const finish = () => {
        canvas.style.display = 'none';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        runningRef.current = false;
      };

      const tick = (now: number) => {
        if (start === 0) start = now;
        const elapsed = now - start;

        if (phase === 'cover') {
          const p = Math.min(1, elapsed / sweepMs);
          drawCovered(Math.floor(p * total));
          if (p >= 1) {
            drawCovered(total);
            if (!fired) {
              fired = true;
              atBlackout();
            }
            phase = 'hold';
            start = now;
          }
          rafRef.current = requestAnimationFrame(tick);
          return;
        }

        if (phase === 'hold') {
          if (elapsed >= HOLD_MS) {
            phase = 'uncover';
            start = now;
          }
          rafRef.current = requestAnimationFrame(tick);
          return;
        }

        const p = Math.min(1, elapsed / sweepMs);
        // Uncovering in the same spiral order makes the screen open the way
        // it closed, rather than appearing to rewind.
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#10101c';
        const from = Math.floor(p * total);
        for (let i = from; i < total; i++) {
          const index = order[i]!;
          const x = (index % cols) * cell;
          const y = Math.floor(index / cols) * cell;
          ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(cell), Math.ceil(cell));
        }
        if (p >= 1) {
          finish();
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };

      // The first frame is drawn immediately so there is never a flash of
      // the world between the call and the first animation frame.
      drawCovered(0);
      rafRef.current = requestAnimationFrame(tick);
    },
  }));

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50"
      style={{ display: 'none' }}
    />
  );
});

import { useEffect, useRef, useState } from 'react';
import { content } from '../../content/portfolio.ts';
import { PanelFrame } from './PanelFrame.tsx';

/**
 * The photo frame on the wall of the house.
 *
 * A photograph inside a pixel-art world is a genuine clash, so the panel
 * offers both treatments and defaults to the crisp original: the point of
 * the frame is that a visitor sees a real face, and a dithered version
 * mostly reads as a smudge. The pixelated option is there because it looks
 * good in context and some people will prefer it.
 *
 * Crisp mode is a plain `<img>` so the photo keeps its alt text and can be
 * saved or zoomed like any image. Pixel mode swaps in a canvas, because
 * pixelating for real means downscaling the raster and letting it back up
 * with smoothing off — `image-rendering: pixelated` on a full-size image
 * does nothing at all, and a CSS filter would only blur it.
 */

const ACCENT = '#f0c040';
/** Width in pixels the photo is crushed down to before being blown back up. */
const PIXEL_WIDTH = 64;

export function PhotoFrame() {
  const [pixelated, setPixelated] = useState(false);
  const [failed, setFailed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!pixelated) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const image = new Image();
    image.onerror = () => setFailed(true);
    image.onload = () => {
      const display = canvas.clientWidth || 288;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = display * dpr;
      canvas.height = display * dpr;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Centre-crop to a square, matching what object-fit: cover does in
      // crisp mode, so toggling does not reframe the subject.
      const side = Math.min(image.width, image.height);
      const sx = (image.width - side) / 2;
      const sy = (image.height - side) / 2;

      const small = document.createElement('canvas');
      small.width = PIXEL_WIDTH;
      small.height = PIXEL_WIDTH;
      const smallCtx = small.getContext('2d');
      if (!smallCtx) return;
      smallCtx.imageSmoothingEnabled = true;
      smallCtx.drawImage(image, sx, sy, side, side, 0, 0, PIXEL_WIDTH, PIXEL_WIDTH);

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(small, 0, 0, canvas.width, canvas.height);
    };
    image.src = content.photo.src;
  }, [pixelated]);

  return (
    <PanelFrame
      kicker="ON THE WALL"
      title={content.photo.caption}
      accent={ACCENT}
      intro={`${content.trainer.title} — ${content.trainer.location}`}
    >
      <div className="flex flex-col items-center">
        {/* The gilt frame, rebuilt in CSS to match the in-world sprite. */}
        <div
          className="border-[6px] border-ink p-2"
          style={{ background: ACCENT, boxShadow: 'inset 0 0 0 3px #b08018' }}
        >
          <div className="border-[3px] border-ink bg-ink2">
            {failed ? (
              <div className="flex h-56 w-56 flex-col items-center justify-center gap-3 px-4 text-center sm:h-72 sm:w-72">
                <span className="font-pixel text-[10px] text-gold">NO PHOTO YET</span>
                <span className="text-xs leading-relaxed text-paper3">
                  Drop your photo at
                  <br />
                  <code className="font-pixel text-[8px] text-paper">public/photo/me.jpg</code>
                </span>
              </div>
            ) : pixelated ? (
              <canvas
                ref={canvasRef}
                role="img"
                aria-label={`${content.photo.alt} (shown as pixel art)`}
                className="block h-56 w-56 sm:h-72 sm:w-72"
              />
            ) : (
              <img
                src={content.photo.src}
                alt={content.photo.alt}
                onError={() => setFailed(true)}
                className="block h-56 w-56 object-cover sm:h-72 sm:w-72"
              />
            )}
          </div>
        </div>

        <p className="mt-5 max-w-md text-center text-sm leading-relaxed text-ink2">
          {content.photo.footnote}
        </p>

        {!failed && (
          <button
            type="button"
            onClick={() => setPixelated((current) => !current)}
            className="pixel-tab mt-4 px-4 py-2 text-[8px]"
            aria-pressed={pixelated}
          >
            {pixelated ? 'SHOW THE REAL PHOTO' : 'PIXELATE IT'}
          </button>
        )}
      </div>
    </PanelFrame>
  );
}

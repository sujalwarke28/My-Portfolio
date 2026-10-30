import { useGameStore } from '../state/useGameStore.ts';
import { AudioToggle } from './AudioToggle.tsx';
import { BadgeToast, BadgeTray } from './BadgeTray.tsx';
import { DialogueBox } from './DialogueBox.tsx';
import { Legend } from './Legend.tsx';
import { Minimap } from './Minimap.tsx';
import { TouchControls } from './TouchControls.tsx';
import { useTouchDevice } from './hooks.ts';

/**
 * The heads-up display.
 *
 * The whole layer is `pointer-events-none` with individual pieces opting
 * back in, so the clickable world underneath keeps receiving clicks in all
 * the gaps between HUD elements. Without that, the invisible full-screen
 * container would swallow every click-to-walk.
 *
 * Placement differs on touch devices because the D-pad occupies the bottom
 * of the screen, which is where the legend lives on a desktop.
 */
export function Hud() {
  const prompt = useGameStore((state) => state.prompt);
  const dialogue = useGameStore((state) => state.dialogue);
  const touch = useTouchDevice();

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute left-3 top-3">
        <Minimap />
      </div>

      <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
        <div className="flex items-start gap-2">
          <BadgeTray />
          <AudioToggle />
        </div>
        {touch && <Legend compact />}
      </div>

      {!touch && (
        <div className="absolute bottom-3 right-3">
          <Legend />
        </div>
      )}

      {/* The contextual hint, hidden while a conversation owns the bottom
          of the screen so the two never stack on top of each other. */}
      {prompt && !dialogue && (
        <div className="absolute inset-x-0 bottom-4 flex justify-center px-4">
          <p className="pixel-frame px-4 py-2 font-pixel text-[9px] text-paper anim-blink">
            {prompt}
          </p>
        </div>
      )}

      <BadgeToast />
      <DialogueBox />
      {touch && <TouchControls />}
    </div>
  );
}

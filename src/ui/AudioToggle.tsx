import { useGameStore } from '../state/useGameStore.ts';

/**
 * Mute toggle.
 *
 * Music that cannot be switched off is the fastest way to make someone close
 * a tab, so this sits in the HUD rather than behind a menu, and the choice
 * is persisted — a returning visitor who muted once stays muted.
 */
export function AudioToggle() {
  const muted = useGameStore((state) => state.muted);
  const toggle = useGameStore((state) => state.toggleMuted);

  return (
    <button
      type="button"
      onClick={toggle}
      className="pixel-frame pointer-events-auto flex h-9 w-9 items-center justify-center text-sm text-paper2 hover:text-gold"
      aria-pressed={muted}
      aria-label={muted ? 'Unmute the music' : 'Mute the music'}
      title={muted ? 'Sound off' : 'Sound on'}
    >
      <span aria-hidden="true">{muted ? '🔇' : '🔊'}</span>
    </button>
  );
}

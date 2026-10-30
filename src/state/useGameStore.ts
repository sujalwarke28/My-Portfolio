import { create } from 'zustand';
import type { BadgeId, PanelId } from '../game/scenes.ts';
import { loadJson, saveJson } from './storage.ts';

/**
 * The single bridge between the game loop and React.
 *
 * The loop runs at 60fps and mutates its own plain objects; it only reaches
 * into this store to publish *discrete events* — a panel opened, a badge
 * earned, the player started or stopped walking. Nothing continuous lives
 * here. Putting the player's position in this store would re-render the
 * entire interface sixty times a second, which is exactly the trap a
 * canvas-game-inside-React falls into.
 *
 * Every setter below is written to bail out when the value has not actually
 * changed, so a loop that calls `setPrompt` every frame with the same string
 * costs nothing.
 */

export type Phase = 'loading' | 'hero' | 'playing';

export interface DialogueState {
  speaker: string;
  lines: string[];
  index: number;
  /**
   * Whether the current line has finished typing out.
   *
   * This lives in the store rather than inside the dialogue component
   * because the interact key is handled by the game loop, and the first
   * press has to mean "show me the rest of this line" while the second
   * means "next line". Without a shared flag, pressing E would skip whole
   * lines of text unread.
   */
  revealed: boolean;
}

export const BADGE_META: Record<BadgeId, { label: string; icon: string; color: string }> = {
  skill: { label: 'Skill Badge', icon: '◆', color: '#e8707c' },
  story: { label: 'Story Badge', icon: '★', color: '#9a70d8' },
  project: { label: 'Builder Badge', icon: '▲', color: '#5aa0e0' },
  contact: { label: 'Signal Badge', icon: '✉', color: '#58c0a8' },
  secret: { label: 'Wanderer Badge', icon: '✦', color: '#f0c040' },
};

export const ALL_BADGES = Object.keys(BADGE_META) as BadgeId[];

type BadgeMap = Partial<Record<BadgeId, boolean>>;

interface Persisted {
  badges: BadgeMap;
  muted: boolean;
  tutorialSeen: boolean;
}

const PERSIST_KEY = 'save';

const persisted = loadJson<Persisted>(PERSIST_KEY, {
  badges: {},
  muted: false,
  tutorialSeen: false,
});

interface GameStore {
  phase: Phase;
  /** Scene the player is currently in, for the minimap and map screen. */
  sceneId: string;
  sceneName: string;

  panel: PanelId | null;
  panelTitle: string;
  dialogue: DialogueState | null;
  mapOpen: boolean;
  tutorialOpen: boolean;
  tutorialSeen: boolean;

  /** Contextual hint such as "Press E to read". */
  prompt: string | null;
  /** Drives the legend's dim-while-walking behaviour. */
  walking: boolean;

  badges: BadgeMap;
  /** Newly earned badge, for the toast. Cleared by the toast itself. */
  badgeToast: BadgeId | null;

  muted: boolean;

  setPhase: (phase: Phase) => void;
  setScene: (id: string, name: string) => void;
  openPanel: (panel: PanelId, title: string) => void;
  closePanel: () => void;
  startDialogue: (speaker: string, lines: string[]) => void;
  advanceDialogue: () => void;
  /** Called by the dialogue box when the typewriter reaches the end. */
  markRevealed: () => void;
  endDialogue: () => void;
  setMapOpen: (open: boolean) => void;
  setTutorialOpen: (open: boolean) => void;
  setPrompt: (prompt: string | null) => void;
  setWalking: (walking: boolean) => void;
  awardBadge: (badge: BadgeId) => void;
  clearBadgeToast: () => void;
  toggleMuted: () => void;
  /** True when any overlay owns the keyboard and the world must not move. */
  isBlocked: () => boolean;
}

function persist(store: GameStore): void {
  saveJson(PERSIST_KEY, {
    badges: store.badges,
    muted: store.muted,
    tutorialSeen: store.tutorialSeen,
  } satisfies Persisted);
}

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'loading',
  sceneId: 'home',
  sceneName: 'Home',

  panel: null,
  panelTitle: '',
  dialogue: null,
  mapOpen: false,
  tutorialOpen: false,
  tutorialSeen: persisted.tutorialSeen,

  prompt: null,
  walking: false,

  badges: persisted.badges,
  badgeToast: null,

  muted: persisted.muted,

  setPhase: (phase) => {
    if (get().phase === phase) return;
    set({ phase });
  },

  setScene: (sceneId, sceneName) => {
    if (get().sceneId === sceneId) return;
    set({ sceneId, sceneName });
  },

  openPanel: (panel, panelTitle) => set({ panel, panelTitle, dialogue: null, prompt: null }),
  closePanel: () => set({ panel: null }),

  startDialogue: (speaker, lines) =>
    set({ dialogue: { speaker, lines, index: 0, revealed: false }, prompt: null }),

  advanceDialogue: () => {
    const dialogue = get().dialogue;
    if (!dialogue) return;
    // First press finishes the line, second press moves on.
    if (!dialogue.revealed) {
      set({ dialogue: { ...dialogue, revealed: true } });
      return;
    }
    if (dialogue.index >= dialogue.lines.length - 1) {
      set({ dialogue: null });
      return;
    }
    set({ dialogue: { ...dialogue, index: dialogue.index + 1, revealed: false } });
  },

  markRevealed: () => {
    const dialogue = get().dialogue;
    if (!dialogue || dialogue.revealed) return;
    set({ dialogue: { ...dialogue, revealed: true } });
  },

  endDialogue: () => set({ dialogue: null }),

  setMapOpen: (mapOpen) => {
    if (get().mapOpen === mapOpen) return;
    set({ mapOpen });
  },

  setTutorialOpen: (tutorialOpen) => {
    const next: Partial<GameStore> = { tutorialOpen };
    if (!tutorialOpen && !get().tutorialSeen) next.tutorialSeen = true;
    set(next);
    if (next.tutorialSeen) persist(get());
  },

  setPrompt: (prompt) => {
    if (get().prompt === prompt) return;
    set({ prompt });
  },

  setWalking: (walking) => {
    if (get().walking === walking) return;
    set({ walking });
  },

  awardBadge: (badge) => {
    if (get().badges[badge]) return;
    set({ badges: { ...get().badges, [badge]: true }, badgeToast: badge });
    persist(get());
  },

  clearBadgeToast: () => set({ badgeToast: null }),

  toggleMuted: () => {
    set({ muted: !get().muted });
    persist(get());
  },

  isBlocked: () => {
    const { phase, panel, dialogue, mapOpen, tutorialOpen } = get();
    return phase !== 'playing' || panel !== null || dialogue !== null || mapOpen || tutorialOpen;
  },
}));

/** Non-reactive access, for the game loop. */
export const gameStore = useGameStore;

/**
 * Dev-only handle on the store, for the console and for browser tests.
 *
 * Stripped from production builds by the `import.meta.env.DEV` guard, so
 * this is not a public surface anyone can poke at on the deployed site.
 */
if (import.meta.env.DEV) {
  (window as unknown as { __gameStore?: typeof useGameStore }).__gameStore = useGameStore;
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { HeroScreen } from './boot/HeroScreen.tsx';
import { SpiralLoader } from './boot/SpiralLoader.tsx';
import { SpiralTransition, type SpiralHandle } from './boot/SpiralTransition.tsx';
import { audio } from './game/audio.ts';
import { Game, type GameHooks } from './game/engine.ts';
import { useGameStore } from './state/useGameStore.ts';
import { GameProvider } from './ui/GameContext.tsx';
import { Hud } from './ui/Hud.tsx';
import { PlainMode } from './ui/PlainMode.tsx';
import { Tutorial } from './ui/Tutorial.tsx';
import { WorldMap } from './ui/WorldMap.tsx';
import { ContactCentre } from './ui/panels/ContactCentre.tsx';
import { PhotoFrame } from './ui/panels/PhotoFrame.tsx';
import { ProjectBuilds } from './ui/panels/ProjectBuilds.tsx';
import { SkillCentre } from './ui/panels/SkillCentre.tsx';
import { StoryTheatre } from './ui/panels/StoryTheatre.tsx';

/**
 * Boot sequence and overlay routing.
 *
 * loading → hero → playing. The loader is not decorative: constructing the
 * Game rasterises the entire sprite atlas and the renderer waits on the
 * pixel font, so there is real work to cover. It is held for a minimum time
 * so a fast machine shows a deliberate animation rather than a flash.
 */

/** Long enough that the loader reads as intentional rather than as a flicker. */
const MIN_LOADER_MS = 900;

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spiralRef = useRef<SpiralHandle>(null);
  const bootStartedAt = useRef(performance.now());

  const [game, setGame] = useState<Game | null>(null);
  const [plainMode, setPlainMode] = useState(false);
  const [bootFailed, setBootFailed] = useState(false);

  const phase = useGameStore((state) => state.phase);
  const setPhase = useGameStore((state) => state.setPhase);
  const panel = useGameStore((state) => state.panel);
  const mapOpen = useGameStore((state) => state.mapOpen);
  const tutorialOpen = useGameStore((state) => state.tutorialOpen);

  // --- Build the world ----------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let instance: Game | null = null;

    const hooks: GameHooks = {
      transition: (atBlackout) => {
        const spiral = spiralRef.current;
        if (spiral) spiral.play(atBlackout);
        else atBlackout();
      },
    };

    // Deferred by a frame so the browser paints the loader before the main
    // thread is tied up rasterising art.
    const handle = window.setTimeout(() => {
      // If the world cannot be built there is no game to show, and leaving
      // the loader spinning for ever is the worst outcome — the content is
      // the point, so fall through to the plain page instead.
      try {
        instance = new Game(canvas, hooks);
      } catch (error) {
        console.error('[boot] the world failed to build', error);
        setBootFailed(true);
        return;
      }
      void instance
        .init()
        .then(() => {
          if (cancelled) return;
          // The loop starts immediately, while the hero screen is still
          // covering everything, so the first frame of the world is already
          // drawn when the wipe opens onto it.
          instance?.start();
          setGame(instance);
        })
        .catch((error: unknown) => {
          console.error('[boot] the world failed to start', error);
          setBootFailed(true);
        });
    }, 32);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
      instance?.dispose();
      setGame(null);
    };
  }, []);

  // --- Loader → hero ------------------------------------------------------
  useEffect(() => {
    if (!game || phase !== 'loading') return;
    const elapsed = performance.now() - bootStartedAt.current;
    const wait = Math.max(0, MIN_LOADER_MS - elapsed);
    const handle = window.setTimeout(() => setPhase('hero'), wait);
    return () => window.clearTimeout(handle);
  }, [game, phase, setPhase]);

  // --- Keep the canvas sized to the window --------------------------------
  useEffect(() => {
    if (!game) return;
    const onResize = () => game.resize();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [game]);

  const startPlaying = useCallback(() => {
    // Audio must be created inside the click handler: a context built any
    // earlier is born suspended and never produces a sound.
    audio.start();
    audio.setMuted(useGameStore.getState().muted);

    const begin = () => {
      setPhase('playing');
      if (!useGameStore.getState().tutorialSeen) {
        useGameStore.getState().setTutorialOpen(true);
      }
    };

    const spiral = spiralRef.current;
    if (spiral) spiral.play(begin);
    else begin();
  }, [setPhase]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-ink">
      {/* The world. Always mounted — the Game needs a canvas to exist before
          it can be constructed, and it renders behind the boot overlays. */}
      <div className="absolute inset-0 flex items-center justify-center bg-ink">
        <canvas ref={canvasRef} aria-label="The game world" role="img" />
      </div>

      {game && phase === 'playing' && (
        <GameProvider value={game}>
          <Hud />
          {mapOpen && <WorldMap />}
          {panel === 'skill' && <SkillCentre />}
          {panel === 'story' && <StoryTheatre />}
          {panel === 'project' && <ProjectBuilds />}
          {panel === 'contact' && <ContactCentre />}
          {panel === 'photo' && <PhotoFrame />}
          {tutorialOpen && <Tutorial />}
        </GameProvider>
      )}

      {phase === 'loading' && !bootFailed && <SpiralLoader />}
      {phase === 'hero' && !bootFailed && (
        <HeroScreen onExplore={startPlaying} onPlainMode={() => setPlainMode(true)} />
      )}
      {(plainMode || bootFailed) && (
        <PlainMode onBack={bootFailed ? null : () => setPlainMode(false)} />
      )}

      <SpiralTransition ref={spiralRef} />
    </div>
  );
}

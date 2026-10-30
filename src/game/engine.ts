import { buildAtlas, TILE, type Atlas } from './art/atlas.ts';
import { Camera } from './camera.ts';
import { assertSceneConnected, CollisionGrid } from './collision.ts';
import { Input, type ActionName, type Direction } from './input.ts';
import { Npc } from './npc.ts';
import { DELTAS, Player } from './player.ts';
import { Renderer } from './renderer.ts';
import {
  sceneHeight,
  sceneWidth,
  type BadgeId,
  type Scene,
  type Trigger,
} from './scenes.ts';
import { isGrassTile } from './world/tiles.ts';
import { buildHome } from './world/maps/home.ts';
import { buildTown } from './world/maps/town.ts';
import { audio } from './audio.ts';
import { gameStore } from '../state/useGameStore.ts';

/**
 * The game controller: owns the world, runs the loop, and translates what
 * happens in it into store events for the interface.
 *
 * Timing uses a clamped variable delta rather than a fixed timestep. Fixed
 * steps matter when you are integrating physics, where a varying dt changes
 * the result; nothing here integrates anything — movement is "interpolate
 * across a step over 140ms" — so a variable dt is exact, and it stays smooth
 * on 120Hz displays where a 60Hz fixed step would show every frame twice.
 */

/** A frame longer than this means the tab was hidden; do not simulate it. */
const MAX_FRAME_MS = 100;
const POSITION_PUBLISH_MS = 100;
const BUMP_COOLDOWN_MS = 220;

export interface GameHooks {
  /**
   * Plays the screen wipe. `atBlackout` is invoked while the screen is fully
   * covered, which is when the world may be swapped without the player
   * seeing it happen.
   */
  transition(atBlackout: () => void): void;
}

export interface PositionListener {
  (tx: number, ty: number, sceneId: string): void;
}

const SCENE_BUILDERS: Record<string, () => Scene> = {
  town: buildTown,
  home: buildHome,
};

/** Which spawn each scene is first entered by, for the dev connectivity check. */
const SCENE_ENTRY: Record<string, string> = {
  town: 'homeDoor',
  home: 'bed',
};

export class Game {
  readonly input = new Input();

  private readonly atlas: Atlas;
  private readonly renderer: Renderer;
  private readonly camera = new Camera();
  private readonly hooks: GameHooks;
  private readonly player = new Player(0, 0, 'down');

  private scenes = new Map<string, Scene>();
  private scene!: Scene;
  private collision!: CollisionGrid;
  private triggerIndex = new Map<string, Trigger[]>();
  private npcs: Npc[] = [];

  private raf = 0;
  private lastFrame = 0;
  private running = false;
  private transitioning = false;

  private positionListeners = new Set<PositionListener>();
  private lastPublish = 0;
  private lastPublished = '';

  /** Where to put the player back when a building panel is closed. */
  private panelReturn: { tx: number; ty: number; facing: Direction } | null = null;
  private unsubscribeStore: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement, hooks: GameHooks) {
    this.hooks = hooks;
    this.atlas = buildAtlas();
    this.renderer = new Renderer(canvas, this.atlas);
    this.input.attach(canvas);
    this.input.onAction = (action) => this.handleAction(action);

    this.enterScene('home', 'bed', false);

    // Putting the player back outside the door when a panel closes is the
    // difference between "you went into the building" and "you are standing
    // in a doorway with a dialog over your face".
    this.unsubscribeStore = gameStore.subscribe((state, prev) => {
      if (prev.panel !== null && state.panel === null && this.panelReturn) {
        const { tx, ty, facing } = this.panelReturn;
        this.panelReturn = null;
        this.player.teleport(tx, ty, facing);
        this.publishPosition(true);
      }
      if (prev.muted !== state.muted) audio.setMuted(state.muted);
    });

    // Dev-only handle for the console and browser tests. Stripped from
    // production builds by the guard.
    if (import.meta.env.DEV) {
      (window as unknown as { __game?: Game }).__game = this;
    }
  }

  async init(): Promise<void> {
    await this.renderer.waitForFont();
    this.renderer.resize();
    this.renderer.setScene(this.scene);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastFrame = 0;
    this.raf = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  dispose(): void {
    this.stop();
    this.input.detach();
    this.unsubscribeStore?.();
  }

  resize(): void {
    this.renderer.resize();
  }

  getScene(): Scene {
    return this.scene;
  }

  getPlayerTile(): [number, number] {
    return [this.player.tx, this.player.ty];
  }

  /** Minimap position feed, published at 10Hz rather than per frame. */
  subscribePosition(listener: PositionListener): () => void {
    this.positionListeners.add(listener);
    listener(this.player.tx, this.player.ty, this.scene.id);
    return () => this.positionListeners.delete(listener);
  }

  /** Fast travel from the map screen. */
  travelTo(spawn: string): void {
    const target = this.scene.spawns[spawn];
    const store = gameStore.getState();
    store.setMapOpen(false);
    if (!target) return;
    audio.sfx('warp');
    this.withTransition(() => {
      this.player.cancelPath();
      this.player.teleport(target.tx, target.ty, target.facing);
      this.publishPosition(true);
    });
  }

  // -------------------------------------------------------------------------
  // Scenes
  // -------------------------------------------------------------------------

  private buildScene(id: string): Scene {
    const cached = this.scenes.get(id);
    if (cached) return cached;
    const builder = SCENE_BUILDERS[id];
    if (!builder) throw new Error(`[game] unknown scene "${id}"`);
    const scene = builder();
    assertSceneConnected(scene, SCENE_ENTRY[id] ?? Object.keys(scene.spawns)[0]!);
    this.scenes.set(id, scene);
    return scene;
  }

  private enterScene(id: string, spawnName: string, rebake: boolean): void {
    const scene = this.buildScene(id);
    const spawn = scene.spawns[spawnName] ?? Object.values(scene.spawns)[0]!;

    this.scene = scene;
    this.collision = new CollisionGrid(scene);
    this.triggerIndex = indexTriggers(scene);
    this.npcs = scene.npcs.map((spec, i) => new Npc(spec, i + 1));
    this.player.cancelPath();
    this.player.teleport(spawn.tx, spawn.ty, spawn.facing);

    if (rebake) this.renderer.setScene(scene);

    const store = gameStore.getState();
    store.setScene(scene.id, scene.name);
    store.setPrompt(null);
    audio.setTrack(scene.indoor ? 'indoor' : 'overworld');
    this.publishPosition(true);
  }

  // -------------------------------------------------------------------------
  // Loop
  // -------------------------------------------------------------------------

  private tick = (now: number): void => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.tick);

    if (this.lastFrame === 0) this.lastFrame = now;
    const dt = Math.min(MAX_FRAME_MS, now - this.lastFrame);
    this.lastFrame = now;

    this.update(dt, now);
    this.render(now);
  };

  private update(dt: number, now: number): void {
    const store = gameStore.getState();
    const blocked = store.isBlocked() || this.transitioning;
    // Hand the movement keys back to the browser while an overlay is up, so
    // the arrow keys scroll the panel the player is reading.
    this.input.captureMovement = !blocked;

    if (blocked) {
      // Held keys are dropped so that closing a panel does not launch the
      // player across the map on a direction they pressed minutes ago.
      this.input.releaseAll();
      this.player.cancelPath();
      store.setWalking(false);
    }

    for (const npc of this.npcs) {
      npc.held = blocked;
      npc.update(dt, (tx, ty) => this.npcCanEnter(npc, tx, ty));
    }

    if (!blocked) {
      this.handleClick();
      this.updatePlayer(dt);
      this.updatePrompt();
    }

    this.player.bumpCooldown = Math.max(0, this.player.bumpCooldown - dt);

    const worldW = sceneWidth(this.scene) * TILE;
    const worldH = sceneHeight(this.scene) * TILE;
    this.camera.follow(
      this.player.px + TILE / 2,
      this.player.py + TILE / 2,
      this.renderer.viewW,
      this.renderer.viewH,
      worldW,
      worldH,
    );

    if (now - this.lastPublish >= POSITION_PUBLISH_MS) {
      this.lastPublish = now;
      this.publishPosition(false);
    }
  }

  private render(now: number): void {
    this.renderer.draw({
      scene: this.scene,
      camera: this.camera,
      player: this.player,
      npcs: this.npcs,
      time: now,
    });
  }

  // -------------------------------------------------------------------------
  // Player movement
  // -------------------------------------------------------------------------

  private updatePlayer(dt: number): void {
    const player = this.player;
    const store = gameStore.getState();

    if (player.stepping) {
      if (player.advance(dt)) this.onArrive();
      store.setWalking(true);
      return;
    }

    const manual = this.input.direction();
    if (manual) player.cancelPath();
    const wanted = manual ?? player.pathDirection();

    if (!wanted) {
      player.clearPivot();
      store.setWalking(false);
      return;
    }

    // Turn first, walk second. Tapping a direction you are not already
    // facing only turns you, which is what makes it possible to stand still
    // and look at something.
    if (player.facing !== wanted) player.turn(wanted);

    if (manual) {
      player.tickPivot(dt);
      if (player.pivoting()) {
        store.setWalking(false);
        return;
      }
    } else {
      // A click-to-walk route skips the pivot beat. The pivot exists so a
      // tap can turn without moving; applying it to a route the player has
      // already committed to just makes every corner of the path stutter.
      player.clearPivot();
    }

    const [dx, dy] = DELTAS[wanted];
    const nx = player.tx + dx;
    const ny = player.ty + dy;

    if (this.playerCanEnter(nx, ny)) {
      player.beginStep(wanted, this.input.running);
      store.setWalking(true);
    } else {
      player.cancelPath();
      store.setWalking(false);
      if (player.bumpCooldown === 0) {
        player.bumpCooldown = BUMP_COOLDOWN_MS;
        audio.sfx('bump');
      }
    }
  }

  private onArrive(): void {
    const player = this.player;
    player.consumePathStep();

    const tile = this.scene.ground[player.ty]?.[player.tx];
    audio.sfx(tile !== undefined && isGrassTile(tile) ? 'grass' : 'step');

    this.fireStepTriggers(player.tx, player.ty);
  }

  private playerCanEnter(tx: number, ty: number): boolean {
    if (this.collision.solid(tx, ty)) return false;
    return !this.npcOccupies(tx, ty);
  }

  private npcCanEnter(self: Npc, tx: number, ty: number): boolean {
    if (this.collision.solid(tx, ty)) return false;
    if (this.player.tx === tx && this.player.ty === ty) return false;
    const [ptx, pty] = this.player.targetTile();
    if (ptx === tx && pty === ty) return false;
    for (const npc of this.npcs) {
      if (npc === self) continue;
      if (npc.tx === tx && npc.ty === ty) return false;
      const [ntx, nty] = npc.targetTile();
      if (ntx === tx && nty === ty) return false;
    }
    return true;
  }

  /** NPCs reserve the tile they are stepping into as well as the one they are on. */
  private npcOccupies(tx: number, ty: number): boolean {
    for (const npc of this.npcs) {
      if (npc.tx === tx && npc.ty === ty) return true;
      const [ntx, nty] = npc.targetTile();
      if (ntx === tx && nty === ty) return true;
    }
    return false;
  }

  private handleClick(): void {
    const click = this.input.consumeClick();
    if (!click) return;
    const [worldX, worldY] = this.renderer.screenToWorld(click.x, click.y, this.camera);
    const tx = Math.floor(worldX / TILE);
    const ty = Math.floor(worldY / TILE);

    // Clicking something you are standing next to interacts with it instead
    // of trying to walk onto it, which is what a player expects when they
    // click a sign.
    const adjacent = Math.abs(tx - this.player.tx) + Math.abs(ty - this.player.ty) === 1;
    if (adjacent) {
      // Turn to look at it first, or the character reads a sign that is
      // behind them.
      const facing =
        tx > this.player.tx
          ? 'right'
          : tx < this.player.tx
            ? 'left'
            : ty > this.player.ty
              ? 'down'
              : 'up';
      this.player.facing = facing;
      if (this.interactWith(tx, ty, true)) return;
    }

    const route = this.collision.path(this.player.tx, this.player.ty, tx, ty, (x, y) =>
      this.npcOccupies(x, y),
    );
    if (route && route.length > 0) {
      this.player.path = route;
      audio.sfx('blip');
    }
  }

  // -------------------------------------------------------------------------
  // Triggers
  // -------------------------------------------------------------------------

  private triggersAt(tx: number, ty: number): Trigger[] {
    return this.triggerIndex.get(`${tx},${ty}`) ?? [];
  }

  /** Warps, doors and automatic flavour text, fired by stepping on a tile. */
  private fireStepTriggers(tx: number, ty: number): void {
    for (const trigger of this.triggersAt(tx, ty)) {
      switch (trigger.kind) {
        case 'warp':
          this.doWarp(trigger.to, trigger.spawn);
          return;
        case 'panel':
          this.doPanel(trigger);
          return;
        case 'talk':
          if (!trigger.auto) break;
          // An automatic line tied to a badge is a one-off discovery; once
          // the badge is earned, walking back over it should stay quiet.
          if (trigger.badge && gameStore.getState().badges[trigger.badge]) break;
          this.doTalk(trigger.speaker, trigger.lines, trigger.badge);
          return;
      }
    }
  }

  /** Signs, people and doors, fired by pressing the interact key. */
  private interactWith(tx: number, ty: number, silentOnMiss: boolean): boolean {
    const npc = this.npcs.find((candidate) => candidate.tx === tx && candidate.ty === ty);
    if (npc) {
      npc.faceToward(this.player.tx, this.player.ty);
      this.doTalk(npc.spec.speaker, npc.spec.lines);
      return true;
    }

    for (const trigger of this.triggersAt(tx, ty)) {
      switch (trigger.kind) {
        case 'talk':
          this.doTalk(trigger.speaker, trigger.lines, trigger.badge);
          return true;
        case 'panel':
          this.panelReturn = {
            tx: this.player.tx,
            ty: this.player.ty,
            facing: this.player.facing,
          };
          this.openPanelTrigger(trigger);
          return true;
        case 'warp':
          this.doWarp(trigger.to, trigger.spawn);
          return true;
      }
    }

    if (!silentOnMiss) audio.sfx('blip');
    return false;
  }

  private doTalk(speaker: string, lines: string[], badge?: BadgeId): void {
    audio.sfx('blip');
    gameStore.getState().startDialogue(speaker, lines);
    if (badge) this.awardBadge(badge);
  }

  private doPanel(trigger: Extract<Trigger, { kind: 'panel' }>): void {
    // The player has just stepped onto the doorway, so the tile they came
    // from is one step back along their facing.
    const [dx, dy] = DELTAS[this.player.facing];
    this.panelReturn = {
      tx: this.player.tx - dx,
      ty: this.player.ty - dy,
      facing: this.player.facing,
    };
    this.openPanelTrigger(trigger);
  }

  private openPanelTrigger(trigger: Extract<Trigger, { kind: 'panel' }>): void {
    audio.sfx('door');
    this.withTransition(() => {
      gameStore.getState().openPanel(trigger.panel, trigger.title);
      if (trigger.badge) this.awardBadge(trigger.badge);
    });
  }

  private doWarp(to: string, spawn: string): void {
    audio.sfx('door');
    this.withTransition(() => this.enterScene(to, spawn, true));
  }

  private awardBadge(badge: BadgeId): void {
    const store = gameStore.getState();
    if (store.badges[badge]) return;
    store.awardBadge(badge);
    audio.sfx('badge');
  }

  private updatePrompt(): void {
    const store = gameStore.getState();
    const [tx, ty] = this.player.facingTile();

    if (this.npcs.some((npc) => npc.tx === tx && npc.ty === ty)) {
      store.setPrompt('Press  E  to talk');
      return;
    }
    for (const trigger of this.triggersAt(tx, ty)) {
      if (trigger.kind === 'talk' && !trigger.auto) {
        store.setPrompt('Press  E  to read');
        return;
      }
      if (trigger.kind === 'panel') {
        store.setPrompt(`Press  E  to enter ${trigger.title}`);
        return;
      }
      if (trigger.kind === 'warp') {
        store.setPrompt('Press  E  to go through');
        return;
      }
    }
    store.setPrompt(null);
  }

  // -------------------------------------------------------------------------
  // Actions and transitions
  // -------------------------------------------------------------------------

  private handleAction(action: ActionName): void {
    const store = gameStore.getState();
    if (store.phase !== 'playing') return;

    switch (action) {
      case 'interact': {
        if (store.dialogue) {
          audio.sfx('blip');
          store.advanceDialogue();
          return;
        }
        if (store.panel || store.mapOpen || store.tutorialOpen) return;
        if (this.transitioning) return;
        const [tx, ty] = this.player.facingTile();
        this.interactWith(tx, ty, false);
        return;
      }

      case 'map': {
        if (store.panel || store.dialogue) return;
        if (store.tutorialOpen) store.setTutorialOpen(false);
        audio.sfx('blip');
        store.setMapOpen(!store.mapOpen);
        return;
      }

      case 'help': {
        if (store.panel || store.dialogue) return;
        if (store.mapOpen) store.setMapOpen(false);
        audio.sfx('blip');
        store.setTutorialOpen(!store.tutorialOpen);
        return;
      }

      case 'cancel': {
        if (store.dialogue) {
          store.endDialogue();
          return;
        }
        if (store.panel) {
          store.closePanel();
          return;
        }
        if (store.mapOpen) {
          store.setMapOpen(false);
          return;
        }
        if (store.tutorialOpen) store.setTutorialOpen(false);
        return;
      }
    }
  }

  /**
   * Wraps a world change in the screen wipe. The guard matters: without it,
   * mashing the interact key on a doorway would queue several transitions
   * and the screen would strobe.
   */
  private withTransition(atBlackout: () => void): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.input.releaseAll();
    this.hooks.transition(() => {
      // `finally` matters here: if the world change throws, the flag would
      // otherwise stay set and the game would be frozen behind a black
      // screen with no way back.
      try {
        atBlackout();
      } finally {
        this.transitioning = false;
      }
    });
  }

  private publishPosition(force: boolean): void {
    const key = `${this.scene.id}:${this.player.tx},${this.player.ty}`;
    if (!force && key === this.lastPublished) return;
    this.lastPublished = key;
    for (const listener of this.positionListeners) {
      listener(this.player.tx, this.player.ty, this.scene.id);
    }
  }
}

function indexTriggers(scene: Scene): Map<string, Trigger[]> {
  const index = new Map<string, Trigger[]>();
  for (const trigger of scene.triggers) {
    const key = `${trigger.tx},${trigger.ty}`;
    const list = index.get(key);
    if (list) list.push(trigger);
    else index.set(key, [trigger]);
  }
  return index;
}

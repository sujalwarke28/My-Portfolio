import type { SpriteName } from './art/atlas.ts';
import type { TileId } from './world/tiles.ts';
import type { Facing, NpcLook } from './art/sprites.ts';

export type { Facing };

/** The content panels that buildings open. */
export type PanelId = 'skill' | 'story' | 'project' | 'contact' | 'photo';

/** Collectibles. Four buildings plus one for the player who pokes around. */
export type BadgeId = 'skill' | 'story' | 'project' | 'contact' | 'secret';

/** A tile rectangle, relative to an object's top-left tile. */
export interface TileRect {
  dx: number;
  dy: number;
  w: number;
  h: number;
}

export interface ObjectDef {
  sprite: SpriteName;
  /** Tiles this object blocks. Omit for decoration you can walk over. */
  solid?: TileRect;
  /** Tiles punched back out of `solid` — doorways. */
  holes?: [number, number][];
  /**
   * Drawn in the ground pass, beneath characters, with no depth sorting.
   * Rugs and doormats are flat on the floor; a tree is not.
   */
  flat?: boolean;
}

/**
 * Every kind of thing that can be placed in a scene.
 *
 * Trees block both of their tiles rather than just the trunk: a walkable
 * tile underneath a solid-looking canopy looks like a bug to anyone who
 * tries it, and the extra tile of depth is what makes a treeline read as
 * impassable rather than decorative.
 */
const DEFS = {
  tree: { sprite: 'tree', solid: { dx: 0, dy: 0, w: 1, h: 2 } },
  tree2: { sprite: 'tree2', solid: { dx: 0, dy: 0, w: 1, h: 2 } },
  tree3: { sprite: 'tree3', solid: { dx: 0, dy: 0, w: 1, h: 2 } },
  bush: { sprite: 'bush', solid: { dx: 0, dy: 0, w: 1, h: 1 } },
  rock: { sprite: 'rock', solid: { dx: 0, dy: 0, w: 1, h: 1 } },
  fenceH: { sprite: 'fenceH', solid: { dx: 0, dy: 0, w: 1, h: 1 } },
  fenceV: { sprite: 'fenceV', solid: { dx: 0, dy: 0, w: 1, h: 1 } },
  sign: { sprite: 'sign', solid: { dx: 0, dy: 0, w: 1, h: 1 } },
  lamp: { sprite: 'lamp', solid: { dx: 0, dy: 1, w: 1, h: 1 } },
  bed: { sprite: 'bed', solid: { dx: 0, dy: 0, w: 2, h: 2 } },
  desk: { sprite: 'desk', solid: { dx: 0, dy: 0, w: 2, h: 2 } },
  shelf: { sprite: 'shelf', solid: { dx: 0, dy: 0, w: 2, h: 2 } },
  plant: { sprite: 'plant', solid: { dx: 0, dy: 0, w: 1, h: 1 } },
  table: { sprite: 'table', solid: { dx: 0, dy: 0, w: 1, h: 1 } },
  photoFrame: { sprite: 'photoFrame', solid: { dx: 0, dy: 0, w: 2, h: 2 } },
  counter: { sprite: 'counter', solid: { dx: 0, dy: 0, w: 3, h: 1 } },
  rug: { sprite: 'rug', flat: true },
  mat: { sprite: 'mat', flat: true },
  homeBuilding: {
    sprite: 'building:home',
    solid: { dx: 0, dy: 0, w: 4, h: 4 },
    holes: [[1, 3]],
  },
  skillBuilding: {
    sprite: 'building:skill',
    solid: { dx: 0, dy: 0, w: 6, h: 5 },
    holes: [[2, 4]],
  },
  storyBuilding: {
    sprite: 'building:story',
    solid: { dx: 0, dy: 0, w: 6, h: 5 },
    holes: [[2, 4]],
  },
  projectBuilding: {
    sprite: 'building:project',
    solid: { dx: 0, dy: 0, w: 6, h: 5 },
    holes: [[2, 4]],
  },
  contactBuilding: {
    sprite: 'building:contact',
    solid: { dx: 0, dy: 0, w: 5, h: 4 },
    holes: [[2, 3]],
  },
} as const satisfies Record<string, ObjectDef>;

export type ObjectKind = keyof typeof DEFS;

/**
 * The same table, widened to `ObjectDef`.
 *
 * `as const satisfies` above is what gives `ObjectKind` its exact set of
 * names, but it also narrows every entry to its own literal type — which
 * means `def.solid` would be a type error on any entry that happens not to
 * have one. Re-exporting through an annotated binding keeps the precise keys
 * and gives every value the full optional shape.
 */
export const OBJECT_DEFS: Record<ObjectKind, ObjectDef> = DEFS;

export interface Placed {
  kind: ObjectKind;
  /** Top-left tile of the object's sprite. */
  tx: number;
  ty: number;
  /** Drawn in the world above the object when the player is nearby. */
  label?: string;
}

/**
 * Triggers.
 *
 * `warp` and `panel` fire when the player steps onto the tile; `talk` fires
 * when the player presses the interact key while facing it, unless `auto` is
 * set, in which case stepping on it is enough.
 */
export type Trigger =
  | { kind: 'warp'; tx: number; ty: number; to: string; spawn: string }
  | { kind: 'panel'; tx: number; ty: number; panel: PanelId; badge?: BadgeId; title: string }
  | {
      kind: 'talk';
      tx: number;
      ty: number;
      speaker: string;
      lines: string[];
      badge?: BadgeId;
      auto?: boolean;
    };

export interface NpcSpec {
  id: string;
  look: NpcLook;
  tx: number;
  ty: number;
  facing: Facing;
  speaker: string;
  lines: string[];
  /** Half-size of the box the NPC paces inside, in tiles. Omit to stand still. */
  wander?: { rx: number; ry: number };
}

export interface Spawn {
  tx: number;
  ty: number;
  facing: Facing;
}

/** A marker shown on the minimap and the full map screen. */
export interface MapMarker {
  tx: number;
  ty: number;
  label: string;
  /** CSS colour for the marker dot. */
  color: string;
  /** Spawn name to fast-travel to, when the building has been found. */
  travelTo?: string;
  badge?: BadgeId;
}

export interface Scene {
  id: string;
  name: string;
  ground: TileId[][];
  objects: Placed[];
  triggers: Trigger[];
  npcs: NpcSpec[];
  spawns: Record<string, Spawn>;
  markers: MapMarker[];
  /** Interiors get dimmer ambient light and the quieter indoor music. */
  indoor?: boolean;
}

export function sceneWidth(scene: Scene): number {
  return scene.ground[0]?.length ?? 0;
}

export function sceneHeight(scene: Scene): number {
  return scene.ground.length;
}

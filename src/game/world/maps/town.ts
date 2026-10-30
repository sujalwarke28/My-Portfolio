import { parseGround, Tile, type TileId } from '../tiles.ts';
import { mulberry32 } from '../../art/draw.ts';
import { OBJECT_DEFS, type ObjectKind, type Placed, type Scene } from '../../scenes.ts';
import { content } from '../../../content/portfolio.ts';

/**
 * Portfolio Town.
 *
 * The map is authored as text so its shape is reviewable in the source — you
 * can see the crossroads and the pond by reading it. Only the interior is
 * written out; the void border is added in code so every row is guaranteed
 * to be the same width, which is the one mistake a hand-typed grid makes
 * constantly and silently.
 *
 * Legend: `.` grass  `,` tall grass  `#` path  `_` sand  `~` water
 *         `*` red flowers  `+` yellow flowers
 */

const INTERIOR_W = 38;

/** Rows for y = 1 .. 30; x = 1 .. 38. */
const INTERIOR: string[] = [
  '......................................', //  1
  '......................................', //  2
  '......................................', //  3
  '....................**................', //  4
  '......................................', //  5
  '......................................', //  6
  '......................................', //  7
  '......................................', //  8
  '......................................', //  9
  '......#...........##.........#........', // 10
  '......#...........##.........#........', // 11
  '......#....**...______.......#........', // 12
  '..##############______##############..', // 13
  '..##############______##############..', // 14
  '................______................', // 15
  '..........++....______................', // 16
  '..~~~~~~~.........##..................', // 17
  '..~~~~~~~.........##..................', // 18
  '..~~~~~~~.........##..................', // 19
  '..~~~~~~~.........##..................', // 20
  '..~~~~~~~.........################....', // 21
  '..~~~~~~~.........##..................', // 22
  '..................##..................', // 23
  '..................##.......++.........', // 24
  '..................##..................', // 25
  '..................##..................', // 26
  '............###########...............', // 27
  '........................,,,,,.........', // 28
  '......................................', // 29
  '......................................', // 30
];

const WIDTH = INTERIOR_W + 2;
const HEIGHT = INTERIOR.length + 2;

/** Buildings: top-left tile, with the door in the footprint's bottom row. */
const BUILDINGS = [
  { kind: 'skillBuilding', tx: 5, ty: 5, label: 'Skill Centre' },
  { kind: 'storyBuilding', tx: 28, ty: 5, label: 'Story Theatre' },
  { kind: 'projectBuilding', tx: 29, ty: 16, label: 'Project Builds' },
  { kind: 'contactBuilding', tx: 11, ty: 23, label: 'Contact Centre' },
  { kind: 'homeBuilding', tx: 22, ty: 23, label: 'Home' },
] as const satisfies ReadonlyArray<Placed & { label: string }>;

/**
 * The clearing behind the north-east treeline, and the single-tile gap that
 * leads into it. Reserved so the tree scatter cannot seal it shut — the
 * whole point of a secret is that it is findable.
 */
const SECRET_TILES: Array<[number, number]> = [
  [34, 3],
  [35, 3],
  [36, 3],
  [37, 3],
  [34, 4],
  [35, 4],
  [36, 4],
  [37, 4],
  // The corridor down to the main road. Reserved all the way, because a
  // single two-tile tree anywhere along it would seal the clearing off.
  [35, 5],
  [35, 6],
  [35, 7],
  [35, 8],
  [35, 9],
  [35, 10],
  [35, 11],
  [35, 12],
];

function buildGround(): TileId[][] {
  if (import.meta.env.DEV) {
    INTERIOR.forEach((row, i) => {
      if (row.length !== INTERIOR_W) {
        throw new Error(
          `[map] town row ${i + 1} is ${row.length} characters, expected ${INTERIOR_W}`,
        );
      }
    });
  }
  const void_ = ' '.repeat(WIDTH);
  return parseGround([void_, ...INTERIOR.map((row) => ` ${row} `), void_]);
}

/** True for the soft, plantable surfaces. Nothing grows on a road. */
function isPlantable(tile: TileId): boolean {
  return tile === Tile.GrassA || tile === Tile.GrassB || tile === Tile.GrassC;
}

/**
 * Lays down the treeline and scatters the woodland.
 *
 * Trees are placed rather than authored because a hand-placed forest of a
 * hundred trees is unreadable in source and miserable to adjust. The rules
 * are: never on anything but plain grass, never touching a road (which gives
 * the paths a natural verge), and never on a reserved tile.
 */
function scatterScenery(ground: TileId[][], placed: Placed[]): void {
  const taken = new Uint8Array(WIDTH * HEIGHT);
  const mark = (tx: number, ty: number) => {
    if (tx < 0 || ty < 0 || tx >= WIDTH || ty >= HEIGHT) return;
    taken[ty * WIDTH + tx] = 1;
  };
  const isTaken = (tx: number, ty: number) =>
    tx < 0 || ty < 0 || tx >= WIDTH || ty >= HEIGHT || taken[ty * WIDTH + tx] === 1;

  // Everything already placed, plus a one-tile margin so scenery never
  // crowds a doorway or a signpost.
  for (const item of placed) {
    const def = OBJECT_DEFS[item.kind];
    const rect = def.solid ?? { dx: 0, dy: 0, w: 1, h: 1 };
    for (let y = -1; y <= rect.h; y++) {
      for (let x = -1; x <= rect.w; x++) mark(item.tx + rect.dx + x, item.ty + rect.dy + y);
    }
  }
  for (const [tx, ty] of SECRET_TILES) mark(tx, ty);

  // Roads and their verges. The margin is deliberately only around paths and
  // sand: extending it to water and the void border would mark the entire
  // outer ring as unavailable and the treeline that walls the town in would
  // never get planted at all.
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const tile = ground[y]![x]!;
      if (tile !== Tile.Path && tile !== Tile.Sand) continue;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) mark(x + dx, y + dy);
      }
    }
  }

  const canPlantTree = (tx: number, ty: number) =>
    isPlantable(ground[ty]?.[tx] ?? Tile.Void) &&
    isPlantable(ground[ty + 1]?.[tx] ?? Tile.Void) &&
    !isTaken(tx, ty) &&
    !isTaken(tx, ty + 1);

  /** Shape chosen from the position, so the same tree is always the same. */
  const treeKind = (tx: number, ty: number): ObjectKind => {
    const hash = Math.abs((tx * 92837111) ^ (ty * 689287499)) % 3;
    return hash === 0 ? 'tree' : hash === 1 ? 'tree2' : 'tree3';
  };

  const plantTree = (tx: number, ty: number) => {
    if (!canPlantTree(tx, ty)) return false;
    placed.push({ kind: treeKind(tx, ty), tx, ty });
    mark(tx, ty);
    mark(tx, ty + 1);
    return true;
  };

  // --- The treeline that walls the town in -------------------------------
  // A tree occupies two vertical tiles, so the side columns step by two.
  for (let x = 2; x <= WIDTH - 3; x++) {
    plantTree(x, 1);
    plantTree(x, HEIGHT - 3);
  }
  for (let y = 1; y <= HEIGHT - 3; y += 2) {
    plantTree(1, y);
    plantTree(WIDTH - 2, y);
  }

  // --- The screen hiding the secret clearing -----------------------------
  plantTree(33, 3);
  plantTree(34, 5);
  plantTree(36, 5);
  plantTree(37, 5);

  // --- Woodland ----------------------------------------------------------
  // Clumps rather than a uniform sprinkle: isolated single trees on open
  // grass read as debris, while two or three together read as woodland.
  const rand = mulberry32(20261029);
  for (let attempt = 0; attempt < 90; attempt++) {
    const cx = 2 + Math.floor(rand() * (WIDTH - 4));
    const cy = 2 + Math.floor(rand() * (HEIGHT - 5));
    if (!canPlantTree(cx, cy)) continue;
    plantTree(cx, cy);
    const extras = 1 + Math.floor(rand() * 3);
    for (let i = 0; i < extras; i++) {
      const ox = cx + Math.round((rand() - 0.5) * 5);
      const oy = cy + Math.round((rand() - 0.5) * 5);
      plantTree(ox, oy);
    }
  }

  // Undergrowth fills the gaps the two-tile trees cannot.
  for (let attempt = 0; attempt < 70; attempt++) {
    const tx = 2 + Math.floor(rand() * (WIDTH - 4));
    const ty = 2 + Math.floor(rand() * (HEIGHT - 4));
    if (!isPlantable(ground[ty]![tx]!) || isTaken(tx, ty)) continue;
    placed.push({ kind: rand() < 0.75 ? 'bush' : 'rock', tx, ty });
    mark(tx, ty);
  }
}

export function buildTown(): Scene {
  const ground = buildGround();

  const objects: Placed[] = [
    // Buildings.
    ...BUILDINGS.map(({ kind, tx, ty, label }) => ({ kind, tx, ty, label })),

    // Nameplates. Each sits on the tile the player faces from the doorstep,
    // so you read the sign on your way in without a detour.
    { kind: 'sign', tx: 6, ty: 10 },
    { kind: 'sign', tx: 29, ty: 10 },
    { kind: 'sign', tx: 31, ty: 22 },
    { kind: 'sign', tx: 12, ty: 27 },
    { kind: 'sign', tx: 22, ty: 28 },
    { kind: 'sign', tx: 18, ty: 16 },

    // Plaza lamps, set just off the road so they frame it without narrowing it.
    { kind: 'lamp', tx: 16, ty: 15 },
    { kind: 'lamp', tx: 23, ty: 15 },

    // A railing along the north shore of the pond.
    ...Array.from({ length: 7 }, (_, i) => ({ kind: 'fenceH' as const, tx: 3 + i, ty: 16 })),

    { kind: 'rock', tx: 10, ty: 18 },
    { kind: 'rock', tx: 10, ty: 21 },
  ];

  scatterScenery(ground, objects);

  const scene: Scene = {
    id: 'town',
    name: 'Portfolio Town',
    ground,
    objects,

    triggers: [
      // Doors. Stepping onto the door tile is what opens a building.
      { kind: 'panel', tx: 7, ty: 9, panel: 'skill', badge: 'skill', title: 'Skill Centre' },
      { kind: 'panel', tx: 30, ty: 9, panel: 'story', badge: 'story', title: 'Story Theatre' },
      {
        kind: 'panel',
        tx: 31,
        ty: 20,
        panel: 'project',
        badge: 'project',
        title: 'Project Builds',
      },
      {
        kind: 'panel',
        tx: 13,
        ty: 26,
        panel: 'contact',
        badge: 'contact',
        title: 'Contact Centre',
      },
      { kind: 'warp', tx: 23, ty: 26, to: 'home', spawn: 'door' },

      // Nameplates.
      {
        kind: 'talk',
        tx: 6,
        ty: 10,
        speaker: 'Sign',
        lines: ['SKILL CENTRE', 'Everything I can do, and roughly how well. Step up to the door.'],
      },
      {
        kind: 'talk',
        tx: 29,
        ty: 10,
        speaker: 'Sign',
        lines: ['STORY THEATRE', 'How I got here, and what I am like once you know me.'],
      },
      {
        kind: 'talk',
        tx: 31,
        ty: 22,
        speaker: 'Sign',
        lines: ['PROJECT BUILDS', 'Things I have made. Source and live links inside.'],
      },
      {
        kind: 'talk',
        tx: 12,
        ty: 27,
        speaker: 'Sign',
        lines: ['CONTACT CENTRE', 'Where to find me when you want to talk.'],
      },
      {
        kind: 'talk',
        tx: 22,
        ty: 28,
        speaker: 'Sign',
        lines: ['HOME', `${content.trainer.name} lives here. The photo on the wall is real.`],
      },
      {
        kind: 'talk',
        tx: 18,
        ty: 16,
        speaker: 'Town Notice',
        lines: content.flavour.welcomeSign,
      },

      // The reward for looking behind the trees.
      {
        kind: 'talk',
        tx: 36,
        ty: 3,
        speaker: 'Quiet Clearing',
        lines: content.flavour.secretFind,
        badge: 'secret',
        auto: true,
      },
    ],

    npcs: [
      {
        id: 'guide',
        look: 'guide',
        tx: 24,
        ty: 27,
        facing: 'left',
        speaker: 'Neighbour',
        lines: content.flavour.guideNpc,
      },
      {
        id: 'kid',
        look: 'kid',
        tx: 21,
        ty: 15,
        facing: 'down',
        speaker: 'Kid In The Plaza',
        lines: [
          'Four buildings and a house! I have been in all of them.',
          'There is a badge for each one. I am collecting them.',
          'I think there is a fifth one somewhere, but I cannot find it.',
        ],
        wander: { rx: 2, ry: 1 },
      },
      {
        id: 'elder',
        look: 'elder',
        tx: 12,
        ty: 19,
        facing: 'right',
        speaker: 'By The Pond',
        lines: [
          'Quiet here, is it not? I come to watch the water.',
          'The Skill Centre is up the road. Mind the flowerbeds.',
        ],
        wander: { rx: 1, ry: 1 },
      },
      {
        id: 'visitor',
        look: 'visitor',
        tx: 33,
        ty: 22,
        facing: 'up',
        speaker: 'Visitor',
        lines: [
          'I came for the Project Builds and stayed for the walk.',
          'Everything in there has a link you can actually click.',
        ],
        wander: { rx: 1, ry: 0 },
      },
    ],

    spawns: {
      homeDoor: { tx: 23, ty: 27, facing: 'down' },
      plaza: { tx: 19, ty: 15, facing: 'up' },
      skill: { tx: 7, ty: 11, facing: 'up' },
      story: { tx: 30, ty: 11, facing: 'up' },
      project: { tx: 31, ty: 21, facing: 'up' },
      contact: { tx: 13, ty: 27, facing: 'up' },
    },

    markers: [
      { tx: 7, ty: 7, label: 'Skill Centre', color: '#e8707c', travelTo: 'skill', badge: 'skill' },
      {
        tx: 30,
        ty: 7,
        label: 'Story Theatre',
        color: '#9a70d8',
        travelTo: 'story',
        badge: 'story',
      },
      {
        tx: 31,
        ty: 18,
        label: 'Project Builds',
        color: '#5aa0e0',
        travelTo: 'project',
        badge: 'project',
      },
      {
        tx: 13,
        ty: 24,
        label: 'Contact Centre',
        color: '#58c0a8',
        travelTo: 'contact',
        badge: 'contact',
      },
      { tx: 23, ty: 24, label: 'Home', color: '#f0c040', travelTo: 'homeDoor' },
      { tx: 19, ty: 15, label: 'Plaza', color: '#f4f4f8', travelTo: 'plaza' },
    ],
  };

  return scene;
}

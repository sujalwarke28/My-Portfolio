import { parseGround } from '../tiles.ts';
import type { PanelId, Scene, Trigger } from '../../scenes.ts';

/**
 * Your house: the room the player spawns in, and the game's tutorial.
 *
 * The teaching order is built into the furniture. The player wakes on the
 * rug with the photo frame straight ahead, so the first thing they do is
 * walk and the second is interact. The two notes by the door cover the keys
 * and the map. By the time they step on the mat they have used every
 * control the game has, without being handed a wall of instructions.
 */

const GROUND_ROWS = [
  'XXXXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXXXX',
  'xxxxxxxxxxxxxxxx',
  'X==============X',
  'X==============X',
  'X==============X',
  'X==============X',
  'X==============X',
  'X==============X',
  'X==============X',
  'X==============X',
  'XXXXXXXXXXXXXXXX',
];

/**
 * Spreads a trigger across every tile of a piece of furniture.
 *
 * A two-by-two bookshelf can be faced from below, from the side, or from
 * above depending on where the player walks in from, and putting the
 * trigger on only one of those tiles produces the worst kind of bug: the
 * object responds *sometimes*, and the player concludes it is scenery.
 * Covering the whole footprint makes "face it and press E" simply true.
 */
function coverTalk(
  tx: number,
  ty: number,
  w: number,
  h: number,
  speaker: string,
  lines: string[],
): Trigger[] {
  const out: Trigger[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      out.push({ kind: 'talk', tx: tx + x, ty: ty + y, speaker, lines });
    }
  }
  return out;
}

function coverPanel(
  tx: number,
  ty: number,
  w: number,
  h: number,
  panel: PanelId,
  title: string,
): Trigger[] {
  const out: Trigger[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      out.push({ kind: 'panel', tx: tx + x, ty: ty + y, panel, title });
    }
  }
  return out;
}

export function buildHome(): Scene {
  return {
    id: 'home',
    name: 'Home',
    indoor: true,
    ground: parseGround(GROUND_ROWS),

    objects: [
      // Against the back wall.
      { kind: 'photoFrame', tx: 3, ty: 1 },
      { kind: 'desk', tx: 10, ty: 1 },
      // The room.
      { kind: 'shelf', tx: 1, ty: 4 },
      { kind: 'rug', tx: 6, ty: 5 },
      { kind: 'bed', tx: 13, ty: 4 },
      { kind: 'table', tx: 1, ty: 8 },
      { kind: 'plant', tx: 14, ty: 9 },
      // The way out, flanked by the two tutorial notes.
      { kind: 'sign', tx: 5, ty: 10 },
      { kind: 'mat', tx: 7, ty: 10 },
      { kind: 'sign', tx: 9, ty: 10 },
    ],

    triggers: [
      // Wall-mounted furniture gets its bottom row only. Its upper row sits
      // inside the wall, where no tile is adjacent to anything walkable —
      // a trigger there could never fire, and the connectivity check in
      // collision.ts rightly refuses to boot with one.
      ...coverPanel(3, 2, 2, 1, 'photo', 'The Photo Frame'),

      ...coverTalk(10, 2, 2, 1, 'Your Desk', [
        'Three monitors’ worth of ambition on a one-monitor desk.',
        'Most of what is in the Project Builds was written right here.',
      ]),

      ...coverTalk(13, 4, 2, 2, 'Your Bed', [
        'Unmade, obviously. There is a town to explore.',
      ]),

      ...coverTalk(1, 4, 2, 2, 'Bookshelf', [
        'Documentation, a few novels, and one book about fonts.',
        'The spines are in no order at all. It works, somehow.',
      ]),

      ...coverTalk(1, 8, 1, 1, 'Side Table', [
        'A lamp, a glass of water, and a notebook full of half-ideas.',
      ]),

      // The two notes that carry the controls.
      {
        kind: 'talk',
        tx: 5,
        ty: 10,
        speaker: 'Note On The Wall',
        lines: [
          'WASD or the arrow keys to walk. Hold SHIFT to run.',
          'E or ENTER to look at whatever you are facing.',
          'You can also click a spot on the ground to walk there.',
        ],
      },
      {
        kind: 'talk',
        tx: 9,
        ty: 10,
        speaker: 'Note On The Wall',
        lines: [
          'Press M at any time for the map.',
          'Once you have found a building, the map will take you straight back to it.',
          'The legend in the corner lists every key.',
        ],
      },

      // Out of the house.
      { kind: 'warp', tx: 7, ty: 10, to: 'town', spawn: 'homeDoor' },
    ],

    npcs: [],

    spawns: {
      /** Where the game begins — on the rug, facing the room. */
      bed: { tx: 7, ty: 7, facing: 'down' },
      /** Coming back in from the town, placed above the mat, not on it. */
      door: { tx: 7, ty: 9, facing: 'up' },
    },

    markers: [
      { tx: 3, ty: 2, label: 'Photo', color: '#f0c040' },
      { tx: 7, ty: 10, label: 'Front Door', color: '#f4f4f8' },
    ],
  };
}

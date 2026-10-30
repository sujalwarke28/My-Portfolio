import { Px } from './draw.ts';

/**
 * Character art.
 *
 * Sprites are 16x24 — a bit over one tile wide and a tile and a half tall,
 * which is the proportion that makes a top-down world read as inhabited
 * rather than as a board game.
 *
 * Bodies (rows 0-16) and legs (rows 17-23) are authored separately and
 * composed at build time. That split exists for a specific reason: if the
 * whole frame were one drawing, the head would inevitably drift a pixel
 * between walk frames and the character would appear to bob its skull.
 * Keeping the body block byte-identical across frames makes that impossible.
 *
 * Only one step frame per direction is drawn; the opposite-leg frame is the
 * mirror of it, which is how the real GBA sprites were built too.
 */

// --- Bodies: rows 0-16 -----------------------------------------------------

const BODY_DOWN = Px.fromRows([
  '................',
  '................',
  '....00000000....',
  '...0rrrrrrrr0...',
  '...0rrrrrrrr0...',
  '...0rrrrrrrr0...',
  '...0RRRRRRRR0...',
  '..0eeeeeeeeee0..',
  '...0AssssssA0...',
  '...0As0ss0sA0...',
  '...0AssssssA0...',
  '....0SssssS0....',
  '..0bbbbbbbbbb0..',
  '..0sbbbbbbbbs0..',
  '..0sbbbbbbbbs0..',
  '..0sbBBBBBBbs0..',
  '..0sBBBBBBBBs0..',
]);

const BODY_UP = Px.fromRows([
  '................',
  '................',
  '....00000000....',
  '...0rrrrrrrr0...',
  '...0rrrrrrrr0...',
  '...0rrrrrrrr0...',
  '...0RRRRRRRR0...',
  '...0eeeeeeee0...',
  '...0AAAAAAAA0...',
  '...0AAAAAAAA0...',
  '...0AaaaaaaA0...',
  '....0AaaaaA0....',
  '..0bbbbbbbbbb0..',
  '..0sbbbbbbbbs0..',
  '..0sbbbbbbbbs0..',
  '..0sbBBBBBBbs0..',
  '..0sBBBBBBBBs0..',
]);

/** Drawn facing left; the right-facing body is its mirror. */
const BODY_SIDE = Px.fromRows([
  '................',
  '................',
  '....000000......',
  '...0rrrrrr0.....',
  '..0rrrrrrrr0....',
  '..0rrrrrrrr0....',
  '..0RRRRRRRR0....',
  '.0eeeeeeeee0....',
  '..0sssssaaA0....',
  '..0s0ssssaA0....',
  '..0ssssssaA0....',
  '...0SssssA0.....',
  '...0bbbbbb0.....',
  '..0bbbbbbbb0....',
  '..0sbbbbbbb0....',
  '..0sbBBBBBB0....',
  '...0BBBBBB0.....',
]);

// --- Legs: rows 17-23 ------------------------------------------------------

const LEGS_IDLE = Px.fromRows([
  '0jjjjjjjj0',
  '0jjjjjjjj0',
  '0jjj00jjj0',
  '0JJJ00JJJ0',
  '0zzz00zzz0',
  '0zzz00zzz0',
  '.000..000.',
]);

/** One leg planted forward and wide, the other lifted — mirror for frame 4. */
const LEGS_STEP = Px.fromRows([
  '0jjjjjjjj0',
  '0jjjjjjjj0',
  '0jjjj0jjj0',
  '0JJJJ0JJ0.',
  '0zzzz0JJ0.',
  '0zzzz0zz0.',
  '.0000.00..',
]);

const LEGS_SIDE_IDLE = Px.fromRows([
  '0jjjjjjj0.',
  '0jjjjjjj0.',
  '0jjjjjjj0.',
  '0JJJJJJJ0.',
  '0zzzzzzz0.',
  '0zzzzzz0..',
  '.0000000..',
]);

/**
 * Side views need both step frames drawn by hand. Mirroring a side-facing
 * sprite flips which way it faces, so the mirror trick that works for the
 * symmetric front and back views would turn a right-walking character
 * around on its fourth frame.
 */
const LEGS_SIDE_STEP_A = Px.fromRows([
  '0jjjjjjj0.',
  '0jjjjjjj0.',
  '0jj0jjjj0.',
  '0JJ0JJJJ0.',
  '0zz0zzzz0.',
  '.00.0zzz0.',
  '....0000..',
]);

const LEGS_SIDE_STEP_B = Px.fromRows([
  '0jjjjjjj0.',
  '0jjjjjjj0.',
  '0jjjj0jj0.',
  '0JJJJ0JJ0.',
  '0zzzz0JJ0.',
  '0zzzz0zz0.',
  '.0000.00..',
]);

// --- Composition -----------------------------------------------------------

export const SPRITE_W = 16;
export const SPRITE_H = 24;
const LEGS_Y = 17;

function compose(body: Px, legs: Px, legsX: number): Px {
  return new Px(SPRITE_W, SPRITE_H).blit(body, 0, 0).blit(legs, legsX, LEGS_Y);
}

export type Facing = 'down' | 'up' | 'left' | 'right';

/**
 * Four frames per direction in the order the animation plays them:
 * idle, step, idle, opposite step. Returning idle on frames 0 and 2 is what
 * gives the walk its characteristic two-beat bounce.
 */
export function buildCharacterFrames(): Record<Facing, Px[]> {
  const downIdle = compose(BODY_DOWN, LEGS_IDLE, 3);
  const downStep = compose(BODY_DOWN, LEGS_STEP, 3);
  const upIdle = compose(BODY_UP, LEGS_IDLE, 3);
  const upStep = compose(BODY_UP, LEGS_STEP, 3);
  const leftIdle = compose(BODY_SIDE, LEGS_SIDE_IDLE, 2);
  const leftStepA = compose(BODY_SIDE, LEGS_SIDE_STEP_A, 2);
  const leftStepB = compose(BODY_SIDE, LEGS_SIDE_STEP_B, 2);

  return {
    // Front and back views are left/right symmetric, so the opposite-leg
    // frame is a free mirror.
    down: [downIdle, downStep, downIdle, downStep.mirrored()],
    up: [upIdle, upStep, upIdle, upStep.mirrored()],
    left: [leftIdle, leftStepA, leftIdle, leftStepB],
    right: [
      leftIdle.mirrored(),
      leftStepA.mirrored(),
      leftIdle.mirrored(),
      leftStepB.mirrored(),
    ],
  };
}

/**
 * Townsfolk are the player's sprite with the palette characters swapped —
 * four distinct-looking residents for the cost of four small objects.
 */
export const NPC_PALETTES: Record<string, Record<string, string>> = {
  /** The guide outside your house: white coat, grey hair. */
  guide: { r: '5', R: '4', e: '3', b: '5', B: '4', a: '4', A: '3' },
  /** A kid in a green cap and yellow shirt. */
  kid: { r: 't', R: 'T', e: 'y', b: 'F', B: 'I', a: 'a', A: 'A' },
  /** An older resident in brown and slate. */
  elder: { r: '2', R: '1', e: '0', b: 'd', B: 'D', a: '4', A: '3' },
  /** A visitor in teal. */
  visitor: { r: 'q', R: 'Q', e: 'u', b: 'f', B: 'R', a: 'A', A: '0' },
};

export type NpcLook = keyof typeof NPC_PALETTES;

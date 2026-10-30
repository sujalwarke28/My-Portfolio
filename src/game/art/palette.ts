/**
 * The whole world's colour ramp, in one place.
 *
 * Every piece of art in this game is defined as single characters indexing
 * into this map, so retinting the entire town is an edit to this file and
 * nothing else. Colours are picked to sit in the GBA's muted, slightly warm
 * range rather than full saturation — that restraint is most of why the
 * era's art reads as cohesive.
 *
 * '.' is always transparent.
 */
export const PALETTE: Record<string, string> = {
  '.': 'transparent',

  // Neutrals / outlines
  '0': '#10101c',
  '1': '#2b2b40',
  '2': '#4a4a68',
  '3': '#7b7b96',
  '4': '#b8b8cc',
  '5': '#f4f4f8',

  // Grass
  g: '#6cb050',
  G: '#4c9038',
  v: '#38702c',

  // Path / soil
  p: '#e0cc98',
  P: '#c4ac78',
  o: '#a08858',

  // Water
  w: '#58a8e8',
  W: '#3878c8',
  u: '#2854a0',

  // Foliage
  t: '#4c9040',
  T: '#34702e',
  y: '#1f4c20',
  k: '#8a6038',
  K: '#5c3c20',

  // Roofing (recoloured per building via tint maps)
  r: '#e05850',
  R: '#b03840',
  e: '#7c2030',

  // Plaster / walls
  c: '#f0e4cc',
  C: '#d4c0a0',
  n: '#a89478',

  // Timber
  d: '#b08048',
  D: '#7a5428',

  // Skin
  s: '#f4c8a0',
  S: '#d49c70',

  // Hair
  a: '#6b4530',
  A: '#3a2418',

  // Shirt
  b: '#4a90e0',
  B: '#2a60b0',

  // Trousers
  j: '#3a4a70',
  J: '#242c48',

  // Shoes
  z: '#2a2a38',

  // Flowers
  f: '#e8585c',
  F: '#f0c848',

  // Glass
  q: '#8ad0f0',
  Q: '#4a90c0',

  // Metal
  m: '#9aa0b4',
  M: '#5a6078',

  // Gold / badges
  i: '#f0c040',
  I: '#b08018',
};

/**
 * Per-building roof and wall recolours, applied as a character substitution
 * when painting. Keeps one building painter serving five distinct buildings.
 */
export type TintMap = Record<string, string>;

export const ROOF_TINTS = {
  /** Home — warm red, the classic starting house. */
  home: {} as TintMap,
  /** Skill Centre — the Pokémon Centre red/white, nudged toward rose. */
  skill: { r: '#e8707c', R: '#c04058', e: '#88203c' } as TintMap,
  /** Story Theatre — deep violet, stage curtains. */
  story: { r: '#9a70d8', R: '#6c48a8', e: '#422c70' } as TintMap,
  /** Project Builds — the Mart blue. */
  project: { r: '#5aa0e0', R: '#3470b8', e: '#204878' } as TintMap,
  /** Contact Centre — brass and teal. */
  contact: { r: '#58c0a8', R: '#2e8878', e: '#1c5850' } as TintMap,
} satisfies Record<string, TintMap>;

export type BuildingKind = keyof typeof ROOF_TINTS;

/** Resolves a character to a CSS colour, honouring an optional tint map. */
export function colorOf(ch: string, tint?: TintMap): string | null {
  if (ch === '.' || ch === ' ') return null;
  const tinted = tint?.[ch];
  if (tinted) return tinted;
  const base = PALETTE[ch];
  if (!base) {
    // Loud in dev, harmless in production: an unknown character is always a
    // typo in art data, and silently skipping it hides the mistake.
    if (import.meta.env.DEV) console.warn(`[art] unknown palette char: "${ch}"`);
    return null;
  }
  return base === 'transparent' ? null : base;
}

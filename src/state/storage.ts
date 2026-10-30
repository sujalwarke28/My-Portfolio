/**
 * localStorage, defensively.
 *
 * Every accessor here is wrapped because `localStorage` is not merely
 * sometimes empty — in a private window, with site data blocked, or inside
 * a thumbnail capture, *touching* it throws. An unguarded read is a white
 * screen for a visitor whose browser is configured slightly differently from
 * yours, which is the worst possible way for a portfolio to fail.
 *
 * Nothing here is load-bearing: the game must work identically when every
 * one of these returns its fallback.
 */

const PREFIX = 'portfolio-quest:';

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Quota, private mode, or blocked site data. Nothing to do but continue.
  }
}

/** True when the user has asked the OS to reduce motion. */
export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

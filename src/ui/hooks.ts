import { useEffect, useState } from 'react';

/**
 * Escape handling for overlays.
 *
 * `Input` already maps Escape to a close action, but it deliberately ignores
 * keys aimed at a focused button — and overlays focus their close button on
 * open. So each overlay also listens directly. The two paths are idempotent:
 * closing something already closed does nothing.
 */
export function useEscapeKey(handler: () => void, active = true): void {
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      handler();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [handler, active]);
}

/** Subscribes to a media query. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    try {
      return window.matchMedia(query).matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    let list: MediaQueryList;
    try {
      list = window.matchMedia(query);
    } catch {
      return;
    }
    const onChange = () => setMatches(list.matches);
    onChange();
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** True on devices whose primary pointer is a finger. */
export function useTouchDevice(): boolean {
  return useMediaQuery('(pointer: coarse)');
}

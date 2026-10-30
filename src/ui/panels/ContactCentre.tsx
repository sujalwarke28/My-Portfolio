import { useState } from 'react';
import { content } from '../../content/portfolio.ts';
import { PanelFrame } from './PanelFrame.tsx';

/**
 * The Contact Centre.
 *
 * Every value is both a link and copyable. That redundancy is on purpose:
 * `mailto:` opens the wrong client for plenty of people and does nothing at
 * all for someone on a work machine, so the address itself has to be
 * obtainable in one click as well.
 */

const ACCENT = '#58c0a8';

export function ContactCentre() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      window.setTimeout(() => setCopied((current) => (current === id ? null : current)), 1800);
    } catch {
      // Clipboard access can be refused outright; the value is on screen and
      // selectable regardless, so there is nothing useful to recover here.
      setCopied(null);
    }
  };

  return (
    <PanelFrame
      kicker="CONTACT CENTRE"
      title="Where To Find Me"
      accent={ACCENT}
      intro={`${content.trainer.name} — ${content.trainer.title}. Happy to hear about roles, projects or anything built with care.`}
    >
      <ul className="space-y-3">
        {content.contact.map((entry) => (
          <li
            key={entry.id}
            className="flex flex-wrap items-center gap-3 border-[3px] border-ink bg-paper2/50 p-3.5"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-ink text-sm"
              style={{ background: ACCENT, color: '#10101c' }}
              aria-hidden="true"
            >
              {entry.icon}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block font-pixel text-[8px] tracking-[0.15em] text-ink3">
                {entry.label}
              </span>
              {entry.href ? (
                <a
                  href={entry.href}
                  target={entry.href.startsWith('http') ? '_blank' : undefined}
                  rel="noreferrer"
                  className="mt-1 block truncate text-sm font-medium text-blue underline decoration-2 underline-offset-2 hover:text-ink"
                >
                  {entry.value}
                </a>
              ) : (
                <span className="mt-1 block truncate text-sm font-medium text-ink2">
                  {entry.value}
                </span>
              )}
            </span>

            {entry.copyable && (
              <button
                type="button"
                onClick={() => copy(entry.id, entry.value)}
                className="pixel-tab shrink-0 px-3 py-2 text-[8px]"
                aria-label={`Copy ${entry.label}`}
              >
                {copied === entry.id ? 'COPIED ✓' : 'COPY'}
              </button>
            )}
          </li>
        ))}
      </ul>

      <p className="mt-6 text-sm leading-relaxed text-ink2">
        Based in {content.trainer.location}. The quickest route is email — I read all of it.
      </p>
    </PanelFrame>
  );
}

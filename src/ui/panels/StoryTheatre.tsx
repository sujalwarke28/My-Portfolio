import { useState } from 'react';
import { content, type StoryChapter } from '../../content/portfolio.ts';
import { PanelFrame } from './PanelFrame.tsx';

/**
 * The Story Theatre: the professional track and the person, split.
 *
 * Keeping them on separate tabs rather than interleaved is a deliberate
 * choice. A recruiter skimming for career history and a future teammate
 * wondering what you are like to sit next to want different halves of the
 * same page, and mixing them means both have to wade through the other.
 */

const ACCENT = '#9a70d8';

const TABS: Array<{ id: StoryChapter['kind']; label: string; blurb: string }> = [
  {
    id: 'professional',
    label: 'THE WORK',
    blurb: 'How I got here, what I do now, and where I am pointed next.',
  },
  {
    id: 'personal',
    label: 'THE PERSON',
    blurb: 'The parts that do not fit on a CV but show up at work anyway.',
  },
];

export function StoryTheatre() {
  const [kind, setKind] = useState<StoryChapter['kind']>('professional');
  const chapters = content.story.filter((chapter) => chapter.kind === kind);
  const tab = TABS.find((candidate) => candidate.id === kind);

  return (
    <PanelFrame kicker="STORY THEATRE" title="About Me" accent={ACCENT} intro={tab?.blurb}>
      <div role="tablist" aria-label="Story sections" className="flex flex-wrap gap-2">
        {TABS.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            role="tab"
            aria-selected={candidate.id === kind}
            onClick={() => setKind(candidate.id)}
            className="pixel-tab px-4 py-2 text-[9px]"
          >
            {candidate.label}
          </button>
        ))}
      </div>

      {/*
        A vertical rule with a marker per chapter. The timeline reads as a
        progression on the work tab and as a set of facets on the personal
        one, which is why both tabs can share the same shape.
      */}
      <ol className="relative mt-6 space-y-6 border-l-4 border-ink2 pl-6">
        {chapters.map((chapter) => (
          <li key={chapter.id} className="relative">
            <span
              className="absolute -left-[2.1rem] top-1 h-4 w-4 border-2 border-ink"
              style={{ background: ACCENT }}
              aria-hidden="true"
            />
            <p className="font-pixel text-[8px] tracking-[0.18em] text-ink3">{chapter.when}</p>
            <h3 className="mt-1.5 font-pixel text-[11px] leading-snug text-ink">
              {chapter.title}
            </h3>
            {chapter.body.map((paragraph, i) => (
              <p key={i} className="mt-2.5 text-sm leading-relaxed text-ink2">
                {paragraph}
              </p>
            ))}
          </li>
        ))}
      </ol>

      {chapters.length === 0 && (
        <p className="mt-6 text-sm text-ink3">Nothing written here yet.</p>
      )}
    </PanelFrame>
  );
}

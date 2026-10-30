import { useState } from 'react';
import { content } from '../../content/portfolio.ts';
import { PanelFrame, StatMeter } from './PanelFrame.tsx';

/**
 * The Skill Centre, laid out as an RPG stat sheet.
 *
 * Skills are grouped and shown as segmented meters because a long flat list
 * of technologies tells a reader nothing — the shape of the group is the
 * information. Selecting a skill reveals the note behind it, which is where
 * the actual evidence lives; a number on its own is just a claim.
 */

const ACCENT = '#e8707c';

export function SkillCentre() {
  const groups = content.skillGroups;
  const [groupId, setGroupId] = useState(groups[0]?.id ?? '');
  const [selected, setSelected] = useState<string | null>(null);

  const group = groups.find((candidate) => candidate.id === groupId) ?? groups[0];

  return (
    <PanelFrame
      kicker="SKILL CENTRE"
      title="What I Can Do"
      accent={ACCENT}
      intro={group?.blurb}
    >
      <div role="tablist" aria-label="Skill groups" className="flex flex-wrap gap-2">
        {groups.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            role="tab"
            aria-selected={candidate.id === group?.id}
            onClick={() => {
              setGroupId(candidate.id);
              setSelected(null);
            }}
            className="pixel-tab px-3 py-2 text-[9px]"
          >
            <span aria-hidden="true" className="mr-1.5">
              {candidate.icon}
            </span>
            {candidate.name}
          </button>
        ))}
      </div>

      <ul className="mt-6 space-y-3">
        {group?.skills.map((skill) => {
          const open = selected === skill.name;
          return (
            <li key={skill.name} className="border-b-2 border-dotted border-paper3 pb-3 last:border-0">
              <button
                type="button"
                onClick={() => setSelected(open ? null : skill.name)}
                aria-expanded={open}
                className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 text-left"
              >
                <span className="font-pixel text-[10px] text-ink">{skill.name}</span>
                <span className="flex items-center gap-3">
                  <StatMeter level={skill.level} color={ACCENT} />
                  <span className="w-10 text-right font-pixel text-[9px] text-ink3">
                    {skill.level}
                  </span>
                </span>
              </button>
              {open && skill.note && (
                <p className="anim-rise mt-2.5 border-l-4 border-ink2 bg-paper2/70 px-3 py-2 text-sm leading-relaxed text-ink2">
                  {skill.note}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-6 font-pixel text-[8px] leading-loose text-ink3">
        CLICK A SKILL TO SEE WHAT IS BEHIND THE NUMBER
      </p>
    </PanelFrame>
  );
}

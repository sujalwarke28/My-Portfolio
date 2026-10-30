import { content } from '../../content/portfolio.ts';
import { PanelFrame, TechChip } from './PanelFrame.tsx';

/**
 * Project Builds.
 *
 * The one panel where the content has a job beyond being read: the links
 * have to be obvious and clickable. They are real anchors with
 * `rel="noreferrer"`, sized as buttons, and a project with no live URL
 * simply does not render that button rather than showing a dead one —
 * a disabled "Live demo" is worse than no demo at all.
 */

const ACCENT = '#5aa0e0';

export function ProjectBuilds() {
  const projects = content.projects;

  return (
    <PanelFrame
      kicker="PROJECT BUILDS"
      title="Things I Have Made"
      accent={ACCENT}
      intro="Source is linked for everything here. Where something is deployed, the live link is next to it."
    >
      <ul className="space-y-5">
        {projects.map((project) => (
          <li
            key={project.id}
            className="border-[3px] border-ink bg-paper2/50 p-4"
            style={
              project.featured
                ? { boxShadow: `inset 0 0 0 3px ${ACCENT}` }
                : undefined
            }
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 className="font-pixel text-[11px] leading-snug text-ink">{project.title}</h3>
              {project.featured && (
                <span
                  className="border-2 border-ink px-2 py-1 font-pixel text-[7px] text-ink"
                  style={{ background: ACCENT }}
                >
                  FEATURED
                </span>
              )}
            </div>

            <p className="mt-3 text-sm leading-relaxed text-ink2">{project.blurb}</p>

            {project.highlight && (
              <p className="mt-3 border-l-4 border-ink2 bg-paper px-3 py-2 text-sm leading-relaxed text-ink2">
                <span className="font-pixel text-[8px] tracking-[0.15em] text-blue">
                  HARD PART
                </span>
                <span className="mt-1.5 block">{project.highlight}</span>
              </p>
            )}

            {project.tech.length > 0 && (
              <ul className="mt-3.5 flex flex-wrap gap-1.5">
                {project.tech.map((tech) => (
                  <li key={tech}>
                    <TechChip label={tech} />
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex flex-wrap gap-2.5">
              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noreferrer"
                  className="pixel-btn px-4 py-2.5 text-[9px] no-underline"
                >
                  ⌨ SOURCE
                </a>
              )}
              {project.live && (
                <a
                  href={project.live}
                  target="_blank"
                  rel="noreferrer"
                  className="pixel-btn px-4 py-2.5 text-[9px] no-underline"
                  style={{
                    background: '#4c9038',
                    boxShadow: 'inset 0 0 0 2px #6cb050, 0 4px 0 0 #10101c',
                  }}
                >
                  ▶ LIVE
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>

      {projects.length === 0 && <p className="text-sm text-ink3">No projects listed yet.</p>}
    </PanelFrame>
  );
}

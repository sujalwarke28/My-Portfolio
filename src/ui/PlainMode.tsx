import { content } from '../content/portfolio.ts';
import { StatMeter, TechChip } from './panels/PanelFrame.tsx';

/**
 * Everything in the portfolio as one scrollable page.
 *
 * A game is a lovely way to present this and a hostile one for several real
 * audiences: someone using a screen reader, someone who cannot use a
 * keyboard or a precise pointer, and a recruiter with four minutes and
 * eleven tabs open. All of them deserve the content, and none of them should
 * have to walk a character across a map to get it.
 *
 * It reads from the same content file as the panels, so it can never fall
 * out of date with the game.
 */
export function PlainMode({ onBack }: { onBack: (() => void) | null }) {
  return (
    <div className="pixel-scroll fixed inset-0 z-40 overflow-y-auto bg-ink px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <header className="pixel-panel px-6 py-6">
          <p className="font-pixel text-[9px] tracking-[0.2em] text-blue">PORTFOLIO — TEXT MODE</p>
          <h1 className="mt-3 font-pixel text-[17px] leading-snug text-ink">
            {content.trainer.name}
          </h1>
          <p className="mt-2 font-pixel text-[10px] text-ink2">{content.trainer.title}</p>
          <p className="mt-3 text-sm leading-relaxed text-ink2">{content.trainer.tagline}</p>
          <p className="mt-1 text-sm text-ink3">{content.trainer.location}</p>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="pixel-btn mt-5 px-5 py-2.5 text-[10px]"
            >
              ◀ PLAY THE GAME INSTEAD
            </button>
          ) : (
            <p className="mt-5 border-l-4 border-brick bg-paper2 px-3 py-2 text-sm text-ink2">
              The interactive version could not start in this browser, so here is
              everything as a page instead.
            </p>
          )}
        </header>

        <Section title="Skills">
          {content.skillGroups.map((group) => (
            <div key={group.id} className="mt-5 first:mt-0">
              <h3 className="font-pixel text-[10px] text-ink">
                <span aria-hidden="true">{group.icon} </span>
                {group.name}
              </h3>
              <p className="mt-1.5 text-sm text-ink3">{group.blurb}</p>
              <ul className="mt-3 space-y-2">
                {group.skills.map((skill) => (
                  <li key={skill.name}>
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                      <span className="text-sm font-medium text-ink2">{skill.name}</span>
                      <span className="flex items-center gap-2">
                        <StatMeter level={skill.level} color="#e8707c" />
                        <span className="w-9 text-right font-pixel text-[8px] text-ink3">
                          {skill.level}
                        </span>
                      </span>
                    </div>
                    {skill.note && <p className="mt-1 text-xs text-ink3">{skill.note}</p>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Section>

        <Section title="About Me">
          {content.story.map((chapter) => (
            <article key={chapter.id} className="mt-5 first:mt-0">
              <p className="font-pixel text-[8px] tracking-[0.18em] text-ink3">
                {chapter.when} · {chapter.kind === 'professional' ? 'WORK' : 'PERSONAL'}
              </p>
              <h3 className="mt-1.5 font-pixel text-[10px] text-ink">{chapter.title}</h3>
              {chapter.body.map((paragraph, i) => (
                <p key={i} className="mt-2 text-sm leading-relaxed text-ink2">
                  {paragraph}
                </p>
              ))}
            </article>
          ))}
        </Section>

        <Section title="Projects">
          {content.projects.map((project) => (
            <article key={project.id} className="mt-5 border-t-2 border-dotted border-paper3 pt-5 first:mt-0 first:border-0 first:pt-0">
              <h3 className="font-pixel text-[10px] text-ink">{project.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink2">{project.blurb}</p>
              {project.highlight && <p className="mt-2 text-xs text-ink3">{project.highlight}</p>}
              {project.tech.length > 0 && (
                <ul className="mt-2.5 flex flex-wrap gap-1.5">
                  {project.tech.map((tech) => (
                    <li key={tech}>
                      <TechChip label={tech} />
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 flex flex-wrap gap-4">
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-blue underline decoration-2 underline-offset-2"
                  >
                    Source code
                  </a>
                )}
                {project.live && (
                  <a
                    href={project.live}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-blue underline decoration-2 underline-offset-2"
                  >
                    Live site
                  </a>
                )}
              </p>
            </article>
          ))}
        </Section>

        <Section title="Contact">
          <ul className="space-y-2.5">
            {content.contact.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-baseline gap-x-3">
                <span className="font-pixel text-[8px] tracking-[0.15em] text-ink3">
                  {entry.label}
                </span>
                {entry.href ? (
                  <a
                    href={entry.href}
                    target={entry.href.startsWith('http') ? '_blank' : undefined}
                    rel="noreferrer"
                    className="text-sm font-medium text-blue underline decoration-2 underline-offset-2"
                  >
                    {entry.value}
                  </a>
                ) : (
                  <span className="text-sm text-ink2">{entry.value}</span>
                )}
              </li>
            ))}
          </ul>
        </Section>

        {onBack && (
          <div className="py-8 text-center">
            <button type="button" onClick={onBack} className="pixel-btn px-6 py-3 text-[10px]">
              ◀ BACK TO THE GAME
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pixel-panel mt-5 px-6 py-6">
      <h2 className="font-pixel text-[12px] tracking-[0.1em] text-blue">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

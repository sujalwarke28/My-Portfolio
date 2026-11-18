import { cv, type CvRole } from '../content/cv.ts';

/**
 * The CV, as a web page.
 *
 * A game is a lovely way to present a portfolio and a hostile one for several
 * real audiences: someone using a screen reader, someone who cannot use a
 * keyboard or a precise pointer, and a recruiter with four minutes and eleven
 * tabs open. All of them deserve the content, and none of them should have to
 * walk a character across a map to get it.
 *
 * It renders src/content/cv.ts as real HTML rather than embedding the PDF,
 * because an embedded PDF is the worst of both worlds on the web: it does not
 * reflow on a phone, it is invisible to search engines, its text fights with
 * screen readers, and it still needs a separate download link anyway. So the
 * page is the document, and the PDF sits one button away for anyone who wants
 * the file itself.
 *
 * It deliberately imports nothing from the game — not even a shared chip
 * component — because this page is the fallback for a browser where the game
 * failed to start. Pulling in game modules would mean a module-level crash in
 * the engine could take the CV down with it, which defeats the point.
 */
export function PlainMode({ onBack }: { onBack: (() => void) | null }) {
  return (
    <div className="pixel-scroll plain-cv fixed inset-0 z-40 overflow-y-auto bg-ink px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <header className="pixel-panel px-6 py-6">
          <p className="font-pixel text-[9px] tracking-[0.2em] text-blue">CURRICULUM VITAE</p>
          <h1 className="mt-3 font-pixel text-[17px] leading-snug text-ink">{cv.name}</h1>
          <p className="mt-2.5 text-sm leading-relaxed text-ink2">{cv.headline}</p>

          <p className="mt-2 text-xs text-ink3">{cv.facts.join(' · ')}</p>

          <ul className="mt-4 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {cv.contact.map((entry) => (
              <li key={entry.label} className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-pixel text-[8px] tracking-[0.15em] text-ink3">
                  {entry.label}
                </span>
                {entry.href ? (
                  <a
                    href={entry.href}
                    target={entry.href.startsWith('http') ? '_blank' : undefined}
                    rel="noreferrer"
                    className="break-all text-sm font-medium text-blue underline decoration-2 underline-offset-2"
                  >
                    {entry.value}
                  </a>
                ) : (
                  <span className="text-sm text-ink2">{entry.value}</span>
                )}
              </li>
            ))}
          </ul>

          <div className="plain-cv-actions mt-5 flex flex-wrap items-center gap-3">
            <a
              href={cv.download.href}
              download={cv.download.filename}
              className="pixel-btn px-5 py-2.5 text-[10px] no-underline"
            >
              ↓ DOWNLOAD PDF
            </a>
            {onBack && (
              <button type="button" onClick={onBack} className="pixel-btn px-5 py-2.5 text-[10px]">
                ◀ PLAY THE GAME INSTEAD
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-ink3">{cv.download.note}</p>

          {!onBack && (
            <p className="mt-4 border-l-4 border-brick bg-paper2 px-3 py-2 text-sm text-ink2">
              The interactive version could not start in this browser, so here is the CV as a page
              instead.
            </p>
          )}
        </header>

        <Section title="About Me">
          <p className="text-sm leading-relaxed text-ink2">{cv.about}</p>
        </Section>

        <Section title="Education and Training">
          {cv.education.map((entry) => (
            <Entry key={entry.title} entry={entry} skillsLabel="Level" />
          ))}
        </Section>

        <Section title="Work Experience">
          {cv.experience.map((entry) => (
            <Entry key={entry.title} entry={entry} skillsLabel="Technical skills" />
          ))}
        </Section>

        <Section title="Skills">
          <dl className="space-y-4">
            {cv.skills.map((group) => (
              <div key={group.label}>
                <dt className="font-pixel text-[9px] tracking-[0.12em] text-ink">{group.label}</dt>
                <dd className="mt-2">
                  <ul className="flex flex-wrap gap-1.5">
                    {group.items.map((item) => (
                      <li key={item}>
                        <Chip label={item} />
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title="Language Skills">
          <p className="text-sm text-ink2">
            <span className="font-pixel text-[8px] tracking-[0.15em] text-ink3">MOTHER TONGUE </span>
            {cv.languages.motherTongue}
          </p>
          <div className="pixel-scroll mt-4 overflow-x-auto">
            <table className="w-full min-w-[32rem] border-collapse text-left">
              <thead>
                <tr>
                  <th scope="col" className="th-cv">
                    Language
                  </th>
                  <th scope="col" className="th-cv">
                    Listening
                  </th>
                  <th scope="col" className="th-cv">
                    Reading
                  </th>
                  <th scope="col" className="th-cv">
                    Spoken production
                  </th>
                  <th scope="col" className="th-cv">
                    Spoken interaction
                  </th>
                  <th scope="col" className="th-cv">
                    Writing
                  </th>
                </tr>
              </thead>
              <tbody>
                {cv.languages.rows.map((row) => (
                  <tr key={row.name}>
                    <th scope="row" className="td-cv font-medium text-ink2">
                      {row.name}
                    </th>
                    <td className="td-cv">{row.listening}</td>
                    <td className="td-cv">{row.reading}</td>
                    <td className="td-cv">{row.spokenProduction}</td>
                    <td className="td-cv">{row.spokenInteraction}</td>
                    <td className="td-cv">{row.writing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-ink3">{cv.languages.scale}</p>
        </Section>

        <Section title="Honours and Awards">
          {cv.honours.map((entry) => (
            <Entry key={entry.title} entry={entry} skillsLabel="Technical skills" />
          ))}
        </Section>

        <Section title="Projects">
          {cv.projects.map((entry) => (
            <Entry key={entry.title} entry={entry} skillsLabel="Technical skills" />
          ))}
        </Section>

        <Section title="Certifications">
          {cv.certifications.map((entry) => (
            <Entry key={entry.title} entry={entry} skillsLabel="Covered" />
          ))}
        </Section>

        <div className="plain-cv-actions flex flex-wrap items-center justify-center gap-3 py-8">
          <a
            href={cv.download.href}
            download={cv.download.filename}
            className="pixel-btn px-6 py-3 text-[10px] no-underline"
          >
            ↓ DOWNLOAD PDF
          </a>
          {onBack && (
            <button type="button" onClick={onBack} className="pixel-btn px-6 py-3 text-[10px]">
              ◀ BACK TO THE GAME
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * One dated entry: the shape every section of a Europass CV repeats. The date
 * leads because that is what a reader scans down the left edge for.
 */
function Entry({ entry, skillsLabel }: { entry: CvRole; skillsLabel: string }) {
  return (
    <article className="mt-5 border-t-2 border-dotted border-paper3 pt-5 first:mt-0 first:border-0 first:pt-0">
      <p className="font-pixel text-[8px] tracking-[0.18em] text-ink3">
        {entry.when}
        {entry.location && ` · ${entry.location.toUpperCase()}`}
      </p>
      <h3 className="mt-1.5 font-pixel text-[10px] leading-snug text-ink">{entry.title}</h3>
      {entry.org && <p className="mt-1.5 text-sm font-medium text-ink2">{entry.org}</p>}
      {entry.body && <p className="mt-2 text-sm leading-relaxed text-ink2">{entry.body}</p>}
      {entry.skills && entry.skills.length > 0 && (
        <p className="mt-3">
          <span className="font-pixel text-[8px] tracking-[0.15em] text-ink3">
            {skillsLabel.toUpperCase()}
          </span>
        </p>
      )}
      {entry.skills && entry.skills.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {entry.skills.map((skill) => (
            <li key={skill}>
              <Chip label={skill} />
            </li>
          ))}
        </ul>
      )}
      {entry.link && (
        <p className="mt-3">
          <a
            href={entry.link.href}
            target="_blank"
            rel="noreferrer"
            className="break-all text-sm font-medium text-blue underline decoration-2 underline-offset-2"
          >
            {entry.link.label}
          </a>
        </p>
      )}
    </article>
  );
}

/** A bordered label. Local by design — see the note at the top of the file. */
function Chip({ label }: { label: string }) {
  return (
    <span className="border-2 border-ink bg-paper2 px-2 py-1 font-pixel text-[8px] text-ink2">
      {label}
    </span>
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

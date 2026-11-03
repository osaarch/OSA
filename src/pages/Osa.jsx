import { profile } from '../content'
import { Frame, Reveal } from '../ui/Frame'
import { href } from '../router'

export default function Osa({ go }) {
  const p = profile
  return (
    <main className="page osa" aria-labelledby="osa-name">
      <div className="osa-grid">
        <Reveal as="figure" className="portrait" delay={0.05}>
          <div className="portrait-frame">
            <Frame src={p.portrait} alt={`Portrait of ${p.name}`} label="Portrait" eager />
          </div>
          {p.portraitCaption && <figcaption>{p.portraitCaption}</figcaption>}
        </Reveal>

        <div className="osa-text">
          <Reveal as="p" className="kicker" delay={0.08}>
            {p.title} <span>·</span> {p.location}
          </Reveal>
          <Reveal as="h1" id="osa-name" className="osa-name" delay={0.14}>
            {p.name}
          </Reveal>
          <Reveal as="p" className="osa-identity" delay={0.22}>
            {p.identity}
          </Reveal>

          <section className="block">
            <Reveal as="h2" className="label">
              <i>01</i> Biography
            </Reveal>
            {p.biography.map((t, i) => (
              <Reveal as="p" className="body" key={i} delay={0.05 * i}>
                {t}
              </Reveal>
            ))}
          </section>

          <section className="block">
            <Reveal as="h2" className="label">
              <i>02</i> Architectural philosophy
            </Reveal>
            <Reveal as="blockquote" className="statement">
              {p.philosophy.statement}
            </Reveal>
            {p.philosophy.paragraphs.map((t, i) => (
              <Reveal as="p" className="body" key={i} delay={0.05 * i}>
                {t}
              </Reveal>
            ))}
          </section>

          <section className="block">
            <Reveal as="h2" className="label">
              <i>03</i> Professional identity
            </Reveal>
            <Reveal as="dl" className="details">
              {p.details.map((d) => (
                <div key={d.label}>
                  <dt>{d.label}</dt>
                  <dd>{d.value}</dd>
                </div>
              ))}
            </Reveal>
          </section>

          <section className="block">
            <Reveal as="h2" className="label">
              <i>04</i> Contact
            </Reveal>
            <Reveal as="ul" className="contact">
              {p.contact.map((c) => (
                <li key={c.label}>
                  <span>{c.label}</span>
                  <a href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                    {c.value}
                  </a>
                </li>
              ))}
            </Reveal>
          </section>

          <Reveal as="div" className="osa-foot">
            <a
              href={href('/works')}
              onClick={(e) => {
                e.preventDefault()
                go('/works')
              }}
              className="link-arrow"
            >
              View the works <span aria-hidden="true">→</span>
            </a>
            {p.placeholder && (
              <p className="placeholder-note">Placeholder content — edit src/content.js and add your portrait.</p>
            )}
          </Reveal>
        </div>
      </div>
    </main>
  )
}

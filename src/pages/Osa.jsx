import { useI18n } from '../i18n'
import { Frame, Reveal } from '../ui/Frame'
import { href } from '../router'

export default function Osa({ go }) {
  const { profile: p, ui } = useI18n()
  return (
    <main className="page osa" aria-labelledby="osa-name">
      <div className="osa-grid">
        <Reveal as="figure" className="portrait" delay={0.05}>
          <div className="portrait-frame">
            <Frame src={p.portrait} alt={ui.portraitAlt} label="Portrait" eager />
          </div>
          {p.portraitCaption && <figcaption>{p.portraitCaption}</figcaption>}
        </Reveal>

        <div className="osa-text">
          <Reveal as="p" className="kicker" delay={0.08}>
            {p.title}
          </Reveal>
          <Reveal as="h1" id="osa-name" className="osa-name" delay={0.14}>
            {p.name}
          </Reveal>
          <Reveal as="p" className="osa-headline" delay={0.2}>
            {p.headline}
          </Reveal>
          <Reveal as="p" className="osa-identity" delay={0.26}>
            {p.identity}
          </Reveal>

          <section className="block">
            <Reveal as="h2" className="label">
              <i>01</i> {ui.biography}
            </Reveal>
            {p.biography.map((t, i) => (
              <Reveal as="p" className="body" key={i} delay={0.05 * i}>
                {t}
              </Reveal>
            ))}
          </section>

          <section className="block">
            <Reveal as="h2" className="label">
              <i>02</i> {ui.philosophy}
            </Reveal>
            {p.philosophy.paragraphs.map((t, i) => (
              <Reveal as="p" className="body" key={i} delay={0.05 * i}>
                {t}
              </Reveal>
            ))}
            <Reveal as="blockquote" className="statement">
              {p.philosophy.statement}
            </Reveal>
          </section>

          <section className="block">
            <Reveal as="h2" className="label">
              <i>03</i> {ui.areas}
            </Reveal>
            <Reveal as="dl" className="details areas">
              {p.areas.map((a, i) => (
                <div key={a}>
                  <dt>{String(i + 1).padStart(2, '0')}</dt>
                  <dd>{a}</dd>
                </div>
              ))}
            </Reveal>
          </section>

          <section className="block">
            <Reveal as="h2" className="label">
              <i>04</i> {ui.contact}
            </Reveal>
            <Reveal as="p" className="body contact-intro">
              {p.contactIntro}
            </Reveal>
            <Reveal as="ul" className="contact">
              {p.contact.map((c) => (
                <li key={c.href}>
                  <span>{c.label}</span>
                  <a
                    href={c.href}
                    target={c.href.startsWith('http') ? '_blank' : undefined}
                    rel="noreferrer"
                    dir={c.ltr || c.href.startsWith('mailto') || c.href.startsWith('http') ? 'ltr' : undefined}
                  >
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
              {ui.viewWorks} <span aria-hidden="true" className="arr">→</span>
            </a>
          </Reveal>
        </div>
      </div>
    </main>
  )
}

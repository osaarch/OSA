import { useEffect, useMemo, useRef } from 'react'
import { findProject, projects, profile } from '../content'
import { Frame, Reveal } from '../ui/Frame'
import { href } from '../router'

// Editorial rhythm: full-bleed → pair → offset → pair → full → offset …
const PATTERN = ['full', 'pair', 'offsetR', 'pair', 'full', 'offsetL']

function buildBlocks(project) {
  const imgs = project.hasImages
    ? project.gallery
    : Array.from({ length: 5 }, (_, i) => ({ src: null, caption: '', label: `Image ${String(i + 1).padStart(2, '0')}` }))
  const blocks = []
  let i = 0
  let k = 0
  while (i < imgs.length) {
    const kind = PATTERN[k++ % PATTERN.length]
    if (kind === 'pair' && i + 1 < imgs.length) {
      blocks.push({ kind: 'pair', imgs: imgs.slice(i, i + 2) })
      i += 2
    } else {
      blocks.push({ kind: kind === 'pair' ? 'full' : kind, imgs: [imgs[i]] })
      i += 1
    }
  }
  return blocks
}

export default function Project({ slug, go }) {
  const project = findProject(slug)
  const ref = useRef(null)

  // gentle parallax on the hero photograph
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const on = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => el.style.setProperty('--sy', el.scrollTop))
    }
    el.addEventListener('scroll', on, { passive: true })
    return () => {
      el.removeEventListener('scroll', on)
      cancelAnimationFrame(raf)
    }
  }, [slug])

  const blocks = useMemo(() => (project ? buildBlocks(project) : []), [project])

  if (!project) {
    return (
      <main className="page project">
        <div className="notfound">
          <p>This project does not exist.</p>
          <a
            href={href('/works')}
            className="link-arrow"
            onClick={(e) => {
              e.preventDefault()
              go('/works')
            }}
          >
            Back to works <span aria-hidden="true">→</span>
          </a>
        </div>
      </main>
    )
  }

  const next = projects[(project.index + 1) % projects.length]
  const meta = [
    ['Year', project.year],
    ['Location', project.location],
    ['Type', project.type],
    ['Status', project.status],
    ['Area', project.area],
    ['Role', project.role],
  ].filter(([, v]) => v)

  return (
    <main className="page project" ref={ref} aria-labelledby="project-title">
      <header className="hero">
        <div className="hero-media">
          <Frame src={project.cover} alt={project.title} label={`${project.number} — ${project.title}`} eager />
        </div>
        <div className="hero-shade" />
        <div className="hero-copy">
          <p className="kicker">
            {project.number} <span>/</span> {project.type}
          </p>
          <h1 id="project-title">{project.title}</h1>
          <p className="hero-sum">{project.summary}</p>
        </div>
        <a
          href={href('/works')}
          className="back"
          onClick={(e) => {
            e.preventDefault()
            go('/works')
          }}
        >
          <span aria-hidden="true">←</span> All works
        </a>
      </header>

      <section className="p-meta">
        {meta.map(([k, v], i) => (
          <Reveal key={k} delay={0.04 * i} className="meta-item">
            <span>{k}</span>
            <b>{v}</b>
          </Reveal>
        ))}
      </section>

      <section className="p-desc">
        <Reveal as="h2" className="label">
          <i>—</i> The project
        </Reveal>
        <div>
          {project.description.map((t, i) => (
            <Reveal as="p" className="body lg" key={i} delay={0.05 * i}>
              {t}
            </Reveal>
          ))}
        </div>
      </section>

      <section className="p-seq" aria-label={`${project.title} — images`}>
        {blocks.map((b, bi) => (
          <div className={`blk blk-${b.kind}`} key={bi}>
            {b.imgs.map((im, ii) => (
              <Reveal as="figure" className="shot" key={ii} delay={0.08 * ii}>
                <div className="shot-media">
                  <Frame src={im.src} alt={im.caption || `${project.title} — image ${bi + ii + 1}`} label={im.label} />
                </div>
                {im.caption && <figcaption>{im.caption}</figcaption>}
              </Reveal>
            ))}
          </div>
        ))}
      </section>

      <footer className="p-next">
        <Reveal as="p" className="label">
          <i>→</i> Next project
        </Reveal>
        <a
          href={href(`/works/${next.slug}`)}
          className="next-link"
          onClick={(e) => {
            e.preventDefault()
            go(`/works/${next.slug}`)
          }}
        >
          <span className="next-n">{next.number}</span>
          <span className="next-t">{next.title}</span>
        </a>
        {profile.placeholder && !project.hasImages && (
          <p className="placeholder-note">
            Placeholder project — add photographs to src/assets/projects/{project.slug}/ and edit src/content.js.
          </p>
        )}
      </footer>
    </main>
  )
}

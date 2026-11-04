import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import { Frame, Reveal } from '../ui/Frame'
import { href } from '../router'
import { clamp } from '../journey'
import { SJ_VH, sj, stadiumWorld, useStadiumLoad } from '../scene/stadium/state'

// The project's own 3D journey is loaded on demand (three.js + the model), only for
// projects that have one (`scene: 'stadium'` in src/content.js).
const StadiumScene = lazy(() => import('../scene/stadium/StadiumScene'))

const root = document.documentElement

class Boundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(err) {
    console.error('Project 3D scene failed:', err)
    this.props.onFail?.()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

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

// A caption is either a plain line or { title, text }.
function Caption({ caption }) {
  if (!caption) return null
  if (typeof caption === 'string') return <figcaption>{caption}</figcaption>
  return (
    <figcaption className="cap-rich">
      <b>{caption.title}</b>
      {caption.text && <span>{caption.text}</span>}
    </figcaption>
  )
}

// The project's logo: shown wherever a project is introduced. A project without one yet
// keeps an honest empty slot (drop logo.svg into its folder in src/assets/projects/).
export function ProjectLogo({ project, className = '' }) {
  if (project.logo) {
    return <img className={`logo-img ${className}`} src={project.logo} alt={`${project.title} — logo`} draggable="false" />
  }
  if (project.hasImages) return null
  return (
    <div className={`logo-slot ${className}`} role="img" aria-label="Project logo placeholder">
      <span>Logo</span>
    </div>
  )
}

// ── the 3D journey: a tall, scrollable section with a sticky instrument layer ──
function Journey({ project, go, jrRef, onFail }) {
  const load = useStadiumLoad()
  const { ui } = useI18n()
  useEffect(() => {
    if (load.error) onFail()
  }, [load.error, onFail])
  useEffect(() => {
    root.classList.toggle('pj-ready', load.ready)
    return () => root.classList.remove('pj-ready')
  }, [load.ready])

  return (
    <>
      <Boundary onFail={onFail}>
        <Suspense fallback={null}>
          <StadiumScene />
        </Suspense>
      </Boundary>

      <section className="pj" ref={jrRef} style={{ height: `${SJ_VH}vh` }} aria-label={`${project.title} — ${ui.journeyAria}`}>
        <div className="pj-sticky">
          <div className="pj-top">
            <span className="pj-title">{project.title}</span>
            <span className="pj-sub">{project.location}</span>
          </div>

          <a
            href={href('/works')}
            className="back pj-back"
            onClick={(e) => {
              e.preventDefault()
              go('/works')
            }}
          >
            <span aria-hidden="true" className="arr-back">←</span> {ui.allWorks}
          </a>

          <div className="pj-chap" aria-hidden="true">
            <span id="pj-chap-n" />
            <b id="pj-chap-t" />
          </div>

          <dl className="pj-read" aria-hidden="true">
            <div>
              <dt>{ui.distance}</dt>
              <dd id="pj-dist">—</dd>
            </div>
            <div>
              <dt>{ui.altitude}</dt>
              <dd id="pj-alt">—</dd>
            </div>
            <div>
              <dt>{ui.bearing}</dt>
              <dd id="pj-brg">—</dd>
            </div>
          </dl>

          <div className="pj-scroll" aria-hidden="true">
            <span>{ui.scroll}</span>
            <i />
          </div>

          <div className="pj-logo" aria-hidden="true">
            {project.logo && <img src={project.logo} alt="" draggable="false" />}
            <span lang="ar" dir="rtl">
              {project.titleAr}
            </span>
          </div>

          <div className={`pj-load${load.ready ? ' is-done' : ''}`} role="status" aria-live="polite">
            <div className="pj-load-line">
              <i style={{ transform: `scaleX(${Math.max(0.02, load.progress)})` }} />
            </div>
            <span>
              {ui.loadingStadium} · {Math.round(load.progress * 100)}%
            </span>
          </div>
        </div>
      </section>
    </>
  )
}

export default function Project({ slug, go }) {
  const { findProject, projects, ui } = useI18n()
  const project = findProject(slug)
  const ref = useRef(null)
  const jrRef = useRef(null)
  const [failed3d, setFailed3d] = useState(false)
  const is3d = Boolean(project && project.scene) && !failed3d
  const onFail = useCallback(() => setFailed3d(true), [])

  // gentle parallax on the hero photograph (classic projects)
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

  // scroll → journey progress (the page itself is the scroll container)
  useEffect(() => {
    if (!is3d) return
    const page = ref.current
    sj.target = sj.current = 0
    sj.velocity = 0
    stadiumWorld.active = true
    stadiumWorld.forceFrames = 4
    const onScroll = () => {
      const jr = jrRef.current
      if (!jr) return
      const span = Math.max(1, jr.offsetHeight - page.clientHeight)
      // the camera arrives at the last frame a little before the end, then holds on the logo
      sj.target = clamp(page.scrollTop / (span * 0.94))
    }
    const onResize = () => {
      onScroll()
      stadiumWorld.forceFrames = 4
    }
    onScroll()
    page.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      page.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      stadiumWorld.active = false
      for (const k of ['--pj', '--pj-black', '--pj-logo', '--pj-hud', '--pj-ink']) root.style.removeProperty(k)
    }
  }, [is3d, slug])

  const blocks = useMemo(() => (project ? buildBlocks(project) : []), [project])

  if (!project) {
    return (
      <main className="page project">
        <div className="notfound">
          <p>{ui.notFound}</p>
          <a
            href={href('/works')}
            className="link-arrow"
            onClick={(e) => {
              e.preventDefault()
              go('/works')
            }}
          >
            {ui.backToWorks} <span aria-hidden="true" className="arr">→</span>
          </a>
        </div>
      </main>
    )
  }

  const next = projects[(project.index + 1) % projects.length]
  const meta = [
    [ui.meta.year, project.year],
    [ui.meta.location, project.location],
    [ui.meta.type, project.type],
    [ui.meta.format, project.format],
    [ui.meta.status, project.status],
    [ui.meta.area, project.area],
    [ui.meta.role, project.role],
  ].filter(([, v]) => v)

  return (
    <main className={`page project${is3d ? ' is-3d' : ''}`} ref={ref} aria-labelledby="project-title">
      {is3d ? (
        <Journey project={project} go={go} jrRef={jrRef} onFail={onFail} />
      ) : (
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
            {project.titleAr && (
              <p className="title-ar" lang="ar" dir="rtl">
                {project.titleAr}
              </p>
            )}
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
            <span aria-hidden="true" className="arr-back">←</span> {ui.allWorks}
          </a>
        </header>
      )}

      <div className="p-body">
        {is3d && (
          <header className="pb-head">
            <ProjectLogo project={project} className="pb-logo" />
            <p className="kicker">
              {project.number} <span>/</span> {project.type}
            </p>
            <h1 id="project-title">{project.title}</h1>
            {project.titleAr && (
              <p className="title-ar" lang="ar" dir="rtl">
                {project.titleAr}
              </p>
            )}
            <p className="hero-sum">{project.summary}</p>
          </header>
        )}

        {!is3d && project.logo && (
          <div className="p-logo-row">
            <ProjectLogo project={project} />
          </div>
        )}

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
            <i>—</i> {ui.overview}
          </Reveal>
          <div>
            {project.description.map((t, i) => (
              <Reveal as="p" className="body lg" key={i} delay={0.05 * i}>
                {t}
              </Reveal>
            ))}
          </div>
        </section>

        {project.concept && (
          <section className="p-desc p-concept">
            <Reveal as="h2" className="label">
              <i>—</i> {ui.concept}
            </Reveal>
            <div>
              <Reveal as="h3" className="p-h3">
                {project.concept.title}
              </Reveal>
              {project.concept.text.map((t, i) => (
                <Reveal as="p" className="body lg" key={i} delay={0.05 * (i + 1)}>
                  {t}
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {project.formGeneration && (
          <section className="p-steps" aria-label={ui.formGeneration}>
            <Reveal as="h2" className="label">
              <i>—</i> {ui.formGeneration}
            </Reveal>
            <ol>
              {project.formGeneration.map((s, i) => (
                <Reveal as="li" key={s.title} delay={0.06 * (i % 3)}>
                  <span className="st-n">{String(i + 1).padStart(2, '0')}</span>
                  <b className="st-t">{s.title}</b>
                  <p>{s.text}</p>
                </Reveal>
              ))}
            </ol>
          </section>
        )}

        {project.material && (
          <section className="p-desc p-material">
            <Reveal as="h2" className="label">
              <i>—</i> {project.material.title}
            </Reveal>
            <div>
              <Reveal as="p" className="body lg">
                {project.material.text}
              </Reveal>
            </div>
          </section>
        )}

        <section className="p-seq" aria-label={`${project.title} — images`}>
          {blocks.map((b, bi) => (
            <div className={`blk blk-${b.kind}`} key={bi}>
              {b.imgs.map((im, ii) => (
                <Reveal as="figure" className="shot" key={ii} delay={0.08 * ii}>
                  <div className="shot-media">
                    <Frame
                      src={im.src}
                      alt={(typeof im.caption === 'string' ? im.caption : im.caption?.title) || `${project.title} — image ${bi + ii + 1}`}
                      label={im.label}
                    />
                  </div>
                  <Caption caption={im.caption} />
                </Reveal>
              ))}
            </div>
          ))}
        </section>

        <footer className="p-next">
          <Reveal as="p" className="label">
            <i>→</i> {ui.nextProject}
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
          {project.placeholder && !project.hasImages && <p className="placeholder-note">{ui.placeholderNote}</p>}
        </footer>
      </div>
    </main>
  )
}

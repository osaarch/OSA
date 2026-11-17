import { useCallback, useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import { Frame } from '../ui/Frame'
import { href } from '../router'
import { Arrow } from '../ui/Arrow'
import { ProjectLogo } from './Project'

// WORKS / ARCHITECTURE — a full-bleed cinematic stage. Hover (or arrow-key / scroll-wheel) through
// the index and the stage wipes between projects; click to open the project page.
export default function Stage({ go, cat: slug }) {
  const { projects: all, ui, categories } = useI18n()
  const cat = categories.find((c) => c.slug === slug)
  const projects = all.filter((p) => p.category === slug)
  const [active, setActive] = useState(0)
  const [prev, setPrev] = useState(null)
  const timer = useRef(0)
  const wheelLock = useRef(0)
  const activeRef = useRef(0)
  activeRef.current = active

  const select = useCallback((i) => {
    const n = (i + projects.length) % projects.length
    if (n === activeRef.current) return
    setPrev(activeRef.current)
    setActive(n)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setPrev(null), 1100)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') select(activeRef.current + 1)
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') select(activeRef.current - 1)
      else if (e.key === 'Enter') go(`/works/${projects[activeRef.current].slug}`)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      clearTimeout(timer.current)
    }
  }, [select, go])

  const onWheel = (e) => {
    const now = performance.now()
    if (now - wheelLock.current < 900 || Math.abs(e.deltaY) < 8) return
    wheelLock.current = now
    select(activeRef.current + (e.deltaY > 0 ? 1 : -1))
  }

  const cur = projects[active]

  return (
    <main className="page works" aria-label={cat?.title} onWheel={onWheel}>
      <div className="works-stage">
        {projects.map((p, i) => (
          <a
            key={p.slug}
            href={href(`/works/${p.slug}`)}
            className={`slide${i === active ? ' is-active' : ''}${i === prev ? ' is-prev' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              go(`/works/${p.slug}`)
            }}
            tabIndex={i === active ? 0 : -1}
            aria-label={`${ui.openProject}: ${p.title}`}
          >
            <div className="slide-media">
              <Frame src={p.cover} alt={p.title} eager={i === 0} />
            </div>
          </a>
        ))}
        <div className="stage-shade" />
        <div className="stage-cap" key={cur.slug}>
          {/* the project's logo has its own place on the stage */}
          {cur.logo && <ProjectLogo project={cur} className="cap-logo" />}
          <span className="cap-t">{cur.title}</span>
          <span className="cap-m">
            {[cur.location, cur.type].filter(Boolean).join(' · ')}
          </span>
        </div>
        <span className="stage-open" aria-hidden="true">
          {ui.openProject} <Arrow />
        </span>
      </div>


      <div className="works-side">
        <a
          href={href('/works')}
          className="works-back"
          onClick={(e) => {
            e.preventDefault()
            go('/works')
          }}
        >
          <Arrow dir="left" className="arr-back" /> {ui.worksTitle}
        </a>
        <h1 className="works-cat">{cat?.title}</h1>
      <ol className="works-list" aria-label={cat?.title}>
        {projects.map((p, i) => (
          <li key={p.slug}>
            <a
              href={href(`/works/${p.slug}`)}
              className={i === active ? 'is-active' : ''}
              onMouseEnter={() => select(i)}
              onFocus={() => select(i)}
              onClick={(e) => {
                e.preventDefault()
                go(`/works/${p.slug}`)
              }}
            >
              <span className="t">{p.title}</span>
            </a>
          </li>
        ))}
      </ol>
      </div>
    </main>
  )
}

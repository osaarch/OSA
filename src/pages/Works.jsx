import { useCallback, useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import { Frame } from '../ui/Frame'
import { href } from '../router'

// WORKS — the categories are just words (Architecture, Product …). Nothing is open until the pointer
// is over one: its work then opens beneath it like an album (black-and-white pictures that take their
// colour under the pointer) and closes again when the pointer leaves. A click enters the project; the
// word itself opens the category's own page. A category appears as soon as it has an entry in src/content.js.
// one row of pictures at their own proportions; the wheel, a drag or a swipe moves along it
function Strip({ children, label }) {
  const ref = useRef(null)
  const drag = useRef({ on: false, x: 0, left: 0, moved: false })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onWheel = (e) => {
      if (el.scrollWidth <= el.clientWidth) return
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      el.scrollLeft += getComputedStyle(el).direction === 'rtl' ? -d : d
      e.preventDefault()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const down = (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    drag.current = { on: true, x: e.clientX, left: ref.current.scrollLeft, moved: false }
  }
  const move = (e) => {
    const d = drag.current
    if (!d.on) return
    const dx = e.clientX - d.x
    if (Math.abs(dx) > 4) d.moved = true
    ref.current.scrollLeft = d.left - dx
  }
  const up = () => {
    drag.current.on = false
  }
  // a drag must not open the picture it ended on
  const click = (e) => {
    if (drag.current.moved) {
      e.preventDefault()
      e.stopPropagation()
      drag.current.moved = false
    }
  }

  return (
    <div
      className="wc-tiles"
      ref={ref}
      role="list"
      aria-label={label}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerLeave={up}
      onClickCapture={click}
    >
      {children}
    </div>
  )
}

export default function Works({ go }) {
  const { categories, ui } = useI18n()
  // -1: nothing is open
  const [active, setActive] = useState(-1)
  const activeRef = useRef(-1)
  activeRef.current = active

  const select = useCallback(
    (i) => {
      const n = i < 0 ? -1 : i % categories.length
      activeRef.current = n
      setActive(n)
    },
    [categories.length],
  )

  useEffect(() => {
    const onKey = (e) => {
      const rtl = document.documentElement.lang === 'ar'
      let step = 0
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') step = rtl ? -1 : 1
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') step = rtl ? 1 : -1
      if (!step) return
      const a = activeRef.current
      const n = categories.length
      select(a < 0 ? (step > 0 ? 0 : n - 1) : (a + step + n) % n)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [select, categories.length])

  const open = (e, path) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return
    e.preventDefault()
    go(path)
  }

  return (
    <main className="page works-choose" aria-label={ui.worksTitle}>
      <h1 className="pj-sr">{ui.worksTitle}</h1>
      <div
        className={`wc-zone${active >= 0 ? ' has-active' : ''}`}
        onMouseLeave={() => select(-1)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) select(-1)
        }}
      >
        <div className="wc-words">
          {categories.map((c, i) => (
            <a
              key={c.slug}
              href={href(c.path)}
              className={`wc-word${i === active ? ' is-active' : ''}`}
              onMouseEnter={() => select(i)}
              onFocus={() => select(i)}
              onClick={(e) => open(e, c.path)}
            >
              {c.title}
            </a>
          ))}
        </div>

        <div className="wc-albums">
          {categories.map((c, i) => (
            <section key={c.slug} className={`wc-album${i === active ? ' is-active' : ''}`} aria-label={c.title}>
              <a href={href(c.path)} className="wc-album-title" onClick={(e) => open(e, c.path)}>
                {c.title}
              </a>
              <Strip label={c.title}>
                {c.items.map((it) => (
                  <a key={it.slug} href={href(it.path)} className="wc-tile" role="listitem" draggable="false" onClick={(e) => open(e, it.path)}>
                    <Frame src={it.cover} alt={it.title} label={it.title} eager />
                    <span className="wc-tile-t">{it.title}</span>
                  </a>
                ))}
              </Strip>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}

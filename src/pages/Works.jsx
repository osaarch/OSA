import { useCallback, useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import { Frame } from '../ui/Frame'
import { href } from '../router'

// WORKS — the categories are just words (Architecture, Product …). Pass the pointer over one and its
// work opens beneath it like an album: black-and-white pictures that take their colour under the pointer;
// a click enters the project. The word itself opens the category's own page. A category appears as soon
// as it has an entry in src/content.js.
export default function Works({ go }) {
  const { categories, ui } = useI18n()
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)
  activeRef.current = active

  const select = useCallback(
    (i) => {
      const n = (i + categories.length) % categories.length
      activeRef.current = n
      setActive(n)
    },
    [categories.length],
  )

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') select(activeRef.current + (document.documentElement.lang === 'ar' ? -1 : 1))
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') select(activeRef.current + (document.documentElement.lang === 'ar' ? 1 : -1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [select])

  const open = (e, path) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return
    e.preventDefault()
    go(path)
  }

  return (
    <main className="page works-choose" aria-label={ui.worksTitle}>
      <h1 className="pj-sr">{ui.worksTitle}</h1>
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
          <section key={c.slug} className={`wc-album${i === active ? ' is-active' : ''}`} data-n={Math.min(c.items.length, 4)} aria-label={c.title}>
            <a href={href(c.path)} className="wc-album-title" onClick={(e) => open(e, c.path)}>
              {c.title}
            </a>
            <div className="wc-tiles">
              {c.items.map((it) => (
                <a key={it.slug} href={href(it.path)} className="wc-tile" onClick={(e) => open(e, it.path)}>
                  <Frame src={it.cover} alt={it.title} label={it.title} eager={i === 0} />
                  <span className="wc-tile-t">{it.title}</span>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}

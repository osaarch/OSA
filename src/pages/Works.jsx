import { useCallback, useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import { Frame } from '../ui/Frame'
import { href } from '../router'

// WORKS — typography only. The categories (Architecture, Landscape, Furniture, Products …) are written
// large; pass the pointer over one (or use ↑ ↓) and its projects open beneath it, with its cover beside;
// click the category for its page, or a project to go straight in. A category appears as soon as it has
// an entry in src/content.js.
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
      if (e.key === 'ArrowDown') select(activeRef.current + 1)
      else if (e.key === 'ArrowUp') select(activeRef.current - 1)
      else if (e.key === 'Enter' && document.activeElement === document.body) go(categories[activeRef.current].path)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [select, go, categories])

  const open = (e, path) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return
    e.preventDefault()
    go(path)
  }

  return (
    <main className="page works-choose" aria-label={ui.worksTitle}>
      <h1 className="pj-sr">{ui.worksTitle}</h1>
      <ul className="wc-list">
        {categories.map((c, i) => (
          <li key={c.slug} className={i === active ? 'is-active' : ''} style={{ '--i': i }} onMouseEnter={() => select(i)}>
            <a href={href(c.path)} className="wc-link" onFocus={() => select(i)} onClick={(e) => open(e, c.path)}>
              <span className="wc-name">{c.title}</span>
              <span className="wc-count">{c.countLabel}</span>
            </a>
            <div className="wc-sub">
              <ul>
                {c.items.map((it) => (
                  <li key={it.slug}>
                    <a href={href(it.path)} onClick={(e) => open(e, it.path)}>
                      {it.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>

      <div className="wc-preview" aria-hidden="true">
        {categories.map((c, i) => (
          <div key={c.slug} className={`wc-pv${i === active ? ' is-on' : ''}`}>
            <Frame src={c.cover} alt="" eager={i === 0} />
          </div>
        ))}
      </div>
    </main>
  )
}

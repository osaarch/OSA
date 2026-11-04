import { href } from '../router'

const ITEMS = [
  { word: 'OSA', path: '/osa', view: 'osa', n: '01', start: 0 },
  { word: 'WORKS', path: '/works', view: 'works', n: '02', start: 3 },
]

// The OSA / WORKS wordmark is one persistent element. On the home screen its
// letters rise into place as the scroll reaches the end of the journey (driven by
// the --menu CSS variable); on every other page the very same element shrinks into
// the corner, so the interface never "cuts" — it travels.
export default function Menu({ view, onNavigate }) {
  const current = view === 'project' ? 'works' : view
  return (
    <nav className="menu" aria-label="Primary">
      <ul>
        {ITEMS.map((it) => (
          <li key={it.word}>
            <a
              href={href(it.path)}
              aria-current={current === it.view ? 'page' : undefined}
              aria-label={it.word}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return
                e.preventDefault()
                onNavigate(it.path)
              }}
            >
              <span className="word" aria-hidden="true">
                {[...it.word].map((ch, i) => (
                  <span className="ch" key={i} style={{ '--i': it.start + i }}>
                    {ch}
                  </span>
                ))}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

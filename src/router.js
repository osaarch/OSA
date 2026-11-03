import { useEffect, useState } from 'react'

// Tiny hash router. Plain, readable hash names work on every static host (and inside
// sandboxed frames):   (none) = home  ·  #osa  ·  #works  ·  #works-<project-slug>
// The browser's back / forward buttons work between pages.
// (The older "#/osa" style is still understood so existing links keep working.)

export function parseHash(hash = window.location.hash) {
  const h = decodeURIComponent(hash.replace(/^#\/?/, '')).replace(/\/+/g, '-').replace(/-+$/, '')
  if (h === 'osa') return { name: 'osa', path: '/osa' }
  if (h.startsWith('works-') && h.length > 6) {
    const slug = h.slice(6)
    return { name: 'project', slug, path: `/works/${slug}` }
  }
  if (h === 'works') return { name: 'works', path: '/works' }
  return { name: 'home', path: '/' }
}

// internal path  ->  URL hash        '/works/project-one' -> '#works-project-one'
export function href(path) {
  if (path === '/' || !path) return '#'
  return '#' + path.replace(/^\//, '').replace(/\//g, '-')
}

export function useHashRoute() {
  const [route, setRoute] = useState(() => parseHash())
  useEffect(() => {
    const on = () => setRoute(parseHash())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

export function setHash(path) {
  window.location.hash = path === '/' ? '' : href(path).slice(1)
}

// Eased programmatic scroll (used by "Skip" and "Replay"): the camera flies the
// journey rather than jumping, and any user input takes the controls back.
let flight = null
export function flyTo(y, ms = 4200) {
  cancelFlight()
  const from = window.scrollY
  const t0 = performance.now()
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
  const state = { raf: 0, stop: false }
  const stop = () => {
    state.stop = true
    cancelAnimationFrame(state.raf)
    window.removeEventListener('wheel', stop)
    window.removeEventListener('touchstart', stop)
    window.removeEventListener('keydown', stop)
  }
  const tick = (now) => {
    if (state.stop) return
    const t = Math.min(1, (now - t0) / ms)
    window.scrollTo(0, from + (y - from) * ease(t))
    if (t < 1) state.raf = requestAnimationFrame(tick)
    else stop()
  }
  window.addEventListener('wheel', stop, { passive: true })
  window.addEventListener('touchstart', stop, { passive: true })
  window.addEventListener('keydown', stop)
  state.raf = requestAnimationFrame(tick)
  flight = stop
}
export function cancelFlight() {
  if (flight) flight()
  flight = null
}

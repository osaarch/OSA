import { Component, lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cancelFlight, flyTo, parseHash, setHash, useHashRoute } from './router'
import { journey, readScrollProgress, scrollMax, SPACER_VH } from './journey'
import { loadState, world } from './scene/world'
import Menu from './ui/Menu'
import Hud from './ui/Hud'
import Loader from './ui/Loader'
import Intro from './ui/Intro'
import SoundToggle from './ui/SoundToggle'
import LangToggle from './ui/LangToggle'
import NightToggle from './ui/NightToggle'
import Rain from './ui/Rain'
import { useI18n } from './i18n'
import { audio, createEngine, renderOffline } from './audio'
import { setRainZone } from './night'
import { findProject } from './content'
import Osa from './pages/Osa'
import Works from './pages/Works'
import Project from './pages/Project'

// The 3D bundle is loaded on demand, so a visitor who lands straight on #works
// never downloads three.js or the model.
const Scene = lazy(() => import('./scene/Scene'))

class Boundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(err) {
    console.error('3D scene failed:', err)
    this.props.onFail?.()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

const root = document.documentElement
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

// The sandstorm teaser plays only for a visitor arriving at the home screen.
if (parseHash().name === 'home') root.classList.add('is-intro')
else world.introDone = true
audio.armFromPreference()
if (/[?&]debug\b/.test(window.location.search)) window.__osaAudio = { renderOffline, createEngine }

export default function App() {
  const route = useHashRoute()
  const { ui } = useI18n()
  const [leaving, setLeaving] = useState(false)
  const [entering, setEntering] = useState(true)
  const [sceneWanted, setSceneWanted] = useState(route.name === 'home')
  const [failed, setFailed] = useState(false)
  const prevView = useRef(null)
  const navTimer = useRef(0)
  const enterTimer = useRef(0)
  const replayPending = useRef(false)
  const routeName = useRef(route.name)
  routeName.current = route.name

  // ── navigation ────────────────────────────────────────────────────────────
  const go = useCallback((path) => {
    if (parseHash().path === path) return
    cancelFlight()
    clearTimeout(navTimer.current)
    if (parseHash().name === 'home') {
      setHash(path) // the wordmark itself travels into the corner: no exit needed
    } else {
      setLeaving(true) // fade the page out, then swap
      navTimer.current = setTimeout(() => setHash(path), 360)
    }
  }, [])

  const flyBack = useCallback(() => {
    if (routeName.current === 'home') {
      flyTo(0, 5200)
    } else {
      replayPending.current = true
      go('/')
    }
  }, [go])

  // ── view bookkeeping ──────────────────────────────────────────────────────
  useLayoutEffect(() => {
    setLeaving(false)
    setEntering(true)
    clearTimeout(enterTimer.current)
    enterTimer.current = setTimeout(() => setEntering(false), 1900)
    root.dataset.view = route.name
    const was = prevView.current
    prevView.current = route.name
    world.paused = route.name !== 'home'
    setRainZone(0) // every page starts dry; the journey that is on screen brings the rain back

    if (route.name === 'home') {
      setSceneWanted(true)
      if (was && was !== 'home') {
        // coming back from OSA / WORKS: resume on the finished interface
        window.scrollTo(0, scrollMax())
        journey.target = journey.current = 1
        journey.velocity = 0
        root.style.setProperty('--menu', '1')
        root.style.setProperty('--black', '1')
        root.dataset.menu = 'live'
        world.forceFrames = 4
        if (replayPending.current) {
          replayPending.current = false
          setTimeout(() => flyTo(0, 5600), 650)
        }
      }
    } else {
      root.style.setProperty('--menu', '1')
      root.style.setProperty('--hud-in', '1')
      const page = document.querySelector('.page')
      if (page) page.scrollTop = 0
      // OSA / WORKS: the dust is gone — only the music remains
      audio.setScene({ wind: 0, music: 1, clarity: 1 })
    }
    // each place has its own music: the Malwiya's maqam, or the stadium's (Rast + frame drum)
    // — and inside a project the home page's music is gone: the stadium has its own, the other
    // projects get the quiet harbour piece with a sea breeze
    const proj = route.name === 'project' ? findProject(route.slug) : null
    // the stadium's score: the modern-desert version (?music=club plays the first, club-style one)
    const stadiumMood = typeof location !== 'undefined' && /[?&]music=club\b/.test(location.search) ? 'stadium' : 'desert'
    const mood = proj ? (proj.scene === 'stadium' ? stadiumMood : 'port') : 'malwiya'
    audio.setMood(mood)
    if (mood === 'port') audio.setScene({ wind: 0.22, music: 1, clarity: 1, pulse: 0, crowd: 0, drive: 0 })
  }, [route.name, route.path])

  // ── scroll → journey progress ─────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      if (routeName.current !== 'home') return
      journey.target = readScrollProgress()
    }
    const onResize = () => {
      onScroll()
      world.forceFrames = 4
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  // ── keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (routeName.current === 'project') go('/works')
      else if (routeName.current !== 'home') go('/')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go])

  // ── 3D unavailable (no WebGL, blocked, …): the interface still works ──────
  const onFail = useCallback(() => {
    setFailed(true)
    journey.target = journey.current = 1
    root.style.setProperty('--menu', '1')
    root.style.setProperty('--black', '1')
    root.dataset.menu = 'live'
  }, [])

  useEffect(() => {
    const unsub = loadState.subscribe(() => {
      if (loadState.get().error) onFail()
    })
    return unsub
  }, [onFail])

  // handy for tests and for debugging in the console
  window.__osa = {
    journey,
    world,
    get ready() {
      return loadState.get().ready
    },
  }

  return (
    <div className="app" data-view={route.name}>
      {sceneWanted && !failed && (
        <Boundary onFail={onFail}>
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Boundary>
      )}

      <div className="fx" aria-hidden="true" />
      <div className="fade-black" aria-hidden="true" />

      {route.name === 'home' && <Hud onReplay={flyBack} />}
      {route.name === 'home' && !world.introDone && <Intro />}

      <Menu view={route.name} onNavigate={go} />

      <div className={`pages${leaving ? ' is-leaving' : ''}${entering ? ' entering' : ''}`}>
        {route.name === 'osa' && <Osa key="osa" go={go} />}
        {route.name === 'works' && <Works key="works" go={go} />}
        {route.name === 'project' && <Project key={route.slug} slug={route.slug} go={go} />}
      </div>

      {route.name !== 'home' && (
        <a
          className="corner-link"
          href="#"
          onClick={(e) => {
            e.preventDefault()
            flyBack()
          }}
        >
          <span aria-hidden="true">↑</span> {ui.flyBackMalwiya}
        </a>
      )}

      <div className="spacer" style={{ height: `${SPACER_VH}vh` }} aria-hidden="true" />

      <div className="ctl">
        <SoundToggle />
        <NightToggle />
        <LangToggle />
      </div>

      <Rain />

      <Loader active={route.name === 'home'} failed={failed} />
      {failed && route.name === 'home' && <p className="webgl-note">{ui.noWebgl}</p>}
    </div>
  )
}

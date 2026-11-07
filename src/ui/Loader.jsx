import { useEffect, useState } from 'react'
import { useLoadState, world } from '../scene/world'
import { audio } from '../audio'
import { useI18n } from '../i18n'

const root = document.documentElement

// Loading screen → "enter" gate. Browsers only allow sound after a click, so the
// visitor chooses here: enter with the soundtrack, or in silence (the sound button in
// the corner can change that at any time). Choosing also starts the sandstorm intro.
export default function Loader({ active, failed }) {
  const s = useLoadState()
  const { ui } = useI18n()
  const [started, setStarted] = useState(world.introDone || world.introStarted)
  const needsGate = active && !failed && !world.introDone
  const done = !needsGate || (s.ready && started)
  const waiting = needsGate && s.ready && !started

  useEffect(() => {
    root.classList.toggle('is-loading', !done)
    root.classList.toggle('is-gate', waiting)
    return () => root.classList.remove('is-loading', 'is-gate')
  }, [done, waiting])

  const enter = (withSound) => {
    if (withSound) audio.enable()
    else audio.disable()
    world.introStarted = true
    root.classList.add('is-started')
    setStarted(true)
  }

  return (
    <div className={`loader${done ? ' is-done' : ''}`} role="status" aria-live="polite">
      <div className="loader-mark">OSA</div>
      <div className={`loader-line${waiting ? ' is-full' : ''}`}>
        <i style={{ transform: `scaleX(${waiting ? 1 : Math.max(0.02, s.progress)})` }} />
      </div>
      {!waiting && (
        <div className="loader-label">
          {s.error ? ui.loadError : `${ui.loadingMalwiya} · ${Math.round(s.progress * 100)}%`}
        </div>
      )}
      {waiting && (
        <div className="gate">
          <p className="gate-note">{ui.bestWithSound}</p>
          <div className="gate-actions">
            <button type="button" className="gate-btn gate-primary" onClick={() => enter(true)}>
              {ui.enterSound}
            </button>
            <button type="button" className="gate-btn" onClick={() => enter(false)}>
              {ui.enterSilent}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

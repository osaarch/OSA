import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import { PODIUM_PANELS as P } from './podiumPanels'

// How the graduation podium came about — a light animation in flat white and grey shapes:
//   0  Al-Malwiya, a spiral that climbs in tiers (only its stepping is taken)
//   1  a pointed gateway arch (the profile)            2  the arch is cut in half along its axis
//   3  each half takes the stepping: the centre arch   4  mirrored, the stepped halves open out as wings
//   5  a low base joins them: the podium
// Stage 3 on uses the real outlines of the Rhino model (podiumPanels.js). 1 unit = 1 cm; ground at y = 0.

const STAGES = 6
const HOLD = [3600, 3000, 2800, 3200, 3200, 5000] // ms each stage stays on screen

const pts = (a) => 'M' + a.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L') + 'Z'
const mirror = (a) => a.map(([x, y]) => [-x, y])

// ── Al-Malwiya: a cone with a ramp that winds five times round it, a round lantern on top, a plinth below ──
const H0 = 26 // plinth height
const CONE = 324 // height of the cone
const TURNS = 5
const R0 = 134
const R1 = 42
const rAt = (h) => R0 - (R0 - R1) * (h / CONE)
const RAMP_W = 9 // how far the ramp stands out from the wall
const RAMP_T = 15 // thickness of the ramp's edge as seen from the front

const malBody = pts([[-R0, -H0], [-R1, -H0 - CONE], [R1, -H0 - CONE], [R0, -H0]])
// the front half of each turn: a ribbon rising from the left edge to the right edge
const malRamps = (() => {
  const out = []
  const pitch = CONE / TURNS
  for (let k = 0; k < TURNS; k++) {
    const top = []
    const bot = []
    for (let i = 0; i <= 28; i++) {
      const t = i / 28
      const phi = -Math.PI / 2 + Math.PI * t
      const h = k * pitch + pitch * (0.5 * t) + pitch * 0.02
      const r = rAt(h) + RAMP_W
      const x = r * Math.sin(phi)
      top.push([x, -H0 - h])
      bot.push([x, -H0 - h + RAMP_T * (1 - 0.35 * Math.abs(Math.sin(phi)))])
    }
    out.push(pts([...top, ...bot.reverse()]))
  }
  return out
})()
const malLantern = pts([[-30, -H0 - CONE], [-27, -H0 - CONE - 58], [27, -H0 - CONE - 58], [30, -H0 - CONE]])
const malCrown = pts([[-34, -H0 - CONE - 58], [-34, -H0 - CONE - 68], [34, -H0 - CONE - 68], [34, -H0 - CONE - 58]])
const malWindows = [-18, -9, 0, 9, 18]
  .map((x) => `M${x - 2.8} ${-H0 - CONE - 12} V${-H0 - CONE - 38} a2.8 2.8 0 0 1 5.6 0 V${-H0 - CONE - 12}Z`)
  .join('')
const malPlinth = pts([[-176, 0], [-176, -H0], [176, -H0], [176, 0]])
const malNiches = [-140, -105, -70, -35, 0, 35, 70, 105, 140]
  .map((x) => `M${x - 8} 0 V-9 a8 8 0 0 1 16 0 V0Z`)
  .join('')

// ── the gateway arch: the left half of the tallest wing panel with its axis moved to x = 0 ──
const HALF = [[-69.2, 0], [-69.3, -343.2], [-68.3, -350.8], [-65.3, -358.2], [-57.5, -367], [0, -400.5], [0, 0]]
const halfL = pts(HALF)
const halfR = pts(mirror(HALF))
const archPts = [...HALF.slice(0, 6), ...mirror(HALF.slice(0, 6)).reverse()]
const archAt = (w, h) => pts(archPts.map(([x, y]) => [(x * w) / 138.5, (y * h) / 400.5]))
const gateFrame = pts([[-150, 0], [-150, -438], [150, -438], [150, 0]])
const gateArch1 = archAt(250, 428)
const gateArch2 = archAt(196, 414)
const gateArch = archAt(138.5, 400.5)
const gateDoor = archAt(54, 128)

const byId = (list, id) => list.find((q) => q.id === id).d

// One shape: it fades (and slides) in at stage `at`; after stage `until` it fades out. `fill` is its grey.
function Part({ d, stage, at, until = STAGES - 1, from, to, delay = 0, fill = '#fff', dim = 1 }) {
  const on = stage >= at && stage <= until
  return (
    <path
      d={d}
      className="pc-part"
      style={{
        fill,
        opacity: on ? dim : 0,
        transform: stage < at ? from || to || 'none' : to || 'none',
        transitionDelay: on ? `${delay}s` : '0s',
      }}
    />
  )
}

export default function PodiumConcept({ stages = [] }) {
  const { ui } = useI18n()
  const reduced = useMemo(
    () => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches),
    [],
  )
  const [stage, setStage] = useState(reduced ? STAGES - 1 : 0)
  const [paused, setPaused] = useState(false)
  const [seen, setSeen] = useState(false)
  const ref = useRef(null)

  // only run while the drawing is on screen
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) {
      setSeen(true)
      return
    }
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!seen || paused || reduced) return
    const t = setTimeout(() => setStage((s) => (s + 1) % STAGES), HOLD[stage])
    return () => clearTimeout(t)
  }, [stage, seen, paused, reduced])

  const pick = (i) => {
    setStage(i)
    setPaused(true)
  }

  const wL = P.wingL
  const wR = P.wingR
  const ar = P.arch
  const st = P.steps
  const S = { stage }

  return (
    <figure className="pc" ref={ref}>
      <svg viewBox="-430 -446 860 468" className="pc-svg" role="img" aria-label={ui.conceptAria}>
        {/* 0 · Al-Malwiya */}
        <Part {...S} d={malPlinth} at={0} until={0} from="translateY(14px)" fill="#6d6d6d" />
        <Part {...S} d={malBody} at={0} until={0} from="translateY(14px)" fill="#3a3a3a" />
        {malRamps.map((d, i) => (
          <Part key={i} {...S} d={d} at={0} until={0} from="translateY(14px)" delay={0.05 * i} fill="#efefef" />
        ))}
        <Part {...S} d={malLantern} at={0} until={0} from="translateY(14px)" fill="#d9d9d9" />
        <Part {...S} d={malCrown} at={0} until={0} from="translateY(14px)" fill="#f4f4f4" />
        <Part {...S} d={malWindows} at={0} until={0} from="translateY(14px)" fill="#0b0b0b" />
        <Part {...S} d={malNiches} at={0} until={0} from="translateY(14px)" fill="#0b0b0b" />

        {/* 1 · the gateway arch: a recessed pointed portal, as in the photograph */}
        <Part {...S} d={gateFrame} at={1} until={1} from="translateY(14px)" fill="#262626" />
        <Part {...S} d={gateArch1} at={1} until={1} from="translateY(14px)" fill="#4a4a4a" delay={0.1} />
        <Part {...S} d={gateArch2} at={1} until={1} from="translateY(14px)" fill="#7c7c7c" delay={0.2} />
        <Part {...S} d={gateArch} at={1} until={1} from="translateY(14px)" fill="#f2f2f2" delay={0.3} />
        <Part {...S} d={gateDoor} at={1} until={1} from="translateY(14px)" fill="#0b0b0b" delay={0.4} />

        {/* 2 · cut in half along the axis */}
        <Part {...S} d={halfL} at={2} until={2} from="translateX(0px)" to="translateX(-14px)" fill="#f2f2f2" />
        <Part {...S} d={halfR} at={2} until={2} from="translateX(0px)" to="translateX(14px)" fill="#f2f2f2" />

        {/* 3 · the halves take the stepping: the centre arch (the tall step at the axis, then lower ones) */}
        <Part {...S} d={byId(ar, 14)} at={3} from="translateX(130px)" delay={0.3} fill="#a9a9a9" />
        <Part {...S} d={byId(ar, 17)} at={3} from="translateX(-130px)" delay={0.3} fill="#a9a9a9" />
        <Part {...S} d={byId(ar, 12)} at={3} from="translateX(70px)" delay={0.15} fill="#c8c8c8" />
        <Part {...S} d={byId(ar, 16)} at={3} from="translateX(-70px)" delay={0.15} fill="#c8c8c8" />
        <Part {...S} d={byId(ar, 13)} at={3} fill="#f2f2f2" />
        <Part {...S} d={byId(ar, 15)} at={3} fill="#f2f2f2" />
        <Part {...S} d={byId(ar, 66)} at={3} from="translateX(40px)" delay={0.2} fill="#e0e0e0" dim={0.9} />
        <Part {...S} d={byId(ar, 65)} at={3} from="translateX(-40px)" delay={0.2} fill="#e0e0e0" dim={0.9} />

        {/* 4 · mirrored, the stepped halves open out as two wings */}
        <Part {...S} d={byId(wL, 11)} at={4} from="translateX(150px)" delay={0.05} fill="#8b8b8b" />
        <Part {...S} d={byId(wR, 8)} at={4} from="translateX(-150px)" delay={0.05} fill="#8b8b8b" />
        <Part {...S} d={byId(wL, 10)} at={4} from="translateX(220px)" delay={0.2} fill="#a0a0a0" />
        <Part {...S} d={byId(wR, 7)} at={4} from="translateX(-220px)" delay={0.2} fill="#a0a0a0" />
        <Part {...S} d={byId(wL, 9)} at={4} from="translateX(290px)" delay={0.35} fill="#b6b6b6" />
        <Part {...S} d={byId(wR, 6)} at={4} from="translateX(-290px)" delay={0.35} fill="#b6b6b6" />

        {/* 5 · a low base joins them */}
        <Part {...S} d={byId(st, 5)} at={5} from="translateY(26px)" delay={0.1} fill="#3b3b3b" />
        <Part {...S} d={byId(st, 4)} at={5} from="translateY(26px)" delay={0.25} fill="#2a2a2a" />
        <Part {...S} d={byId(st, 3)} at={5} from="translateY(26px)" delay={0.4} fill="#1c1c1c" />
      </svg>

      <div className="pc-cap" aria-live="polite">
        {stages.map((s, i) => (
          <p key={i} className={i === stage ? 'is-on' : ''} aria-hidden={i !== stage}>
            <b>{s.title}</b>
            <span>{s.text}</span>
          </p>
        ))}
      </div>

      <div className="pc-dots" role="group" aria-label={ui.conceptStep}>
        {Array.from({ length: STAGES }, (_, i) => (
          <button
            key={i}
            type="button"
            className={`pc-dot${i === stage ? ' is-on' : ''}`}
            aria-label={stages[i]?.title || ui.conceptStep}
            aria-current={i === stage ? 'step' : undefined}
            onClick={() => pick(i)}
          />
        ))}
      </div>
    </figure>
  )
}

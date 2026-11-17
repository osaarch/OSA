import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import { PODIUM_PANELS as PANELS } from './podiumPanels'

// How the graduation podium came about — a light animation in flat white and grey shapes:
//   0  Al-Malwiya, drawn as in the photograph: drum-like tiers, the ramp winding up across them, a lantern on top
//   1  only its stepping is kept: the Malwiya cut along its axis, one half left, the profile reads as a stair
//   2  a pointed gateway arch (the profile)            3  the arch is cut in half along its axis
//   4  each half takes the stepping: the centre arch   5  mirrored, the stepped halves open out as wings
//   6  a low base joins them: the podium
// Stage 4 on uses the real outlines of the Rhino model (podiumPanels.js). 1 unit = 1 cm; ground at y = 0.

const STAGES = 7
const HOLD = [3800, 4200, 3000, 2800, 3200, 3200, 5000] // ms each stage stays on screen

const pts = (a) => 'M' + a.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L') + 'Z'
const mirror = (a) => a.map(([x, y]) => [-x, y])

// ── Al-Malwiya: tiers (one for each turn of the ramp), each narrower than the one below. Seen from the front
// the ramp climbs across a tier from its left edge to its right edge; where a turn ends the wall steps inward. ──
const H0 = 30 // the two-step plinth
const P = 60 // rise of one turn of the ramp
const TURNS = 5
const WALL = 48 // height of a tier's wall; the rest of the turn is the ramp's edge
const R_TIER = [104, 88, 72, 56, 40] // radius of each tier's wall
const RAMP_OUT = 5 // how far the ramp stands out from the wall
const ARC = 22 // steps along a half turn

// a front-half helix edge: from the left (φ = −90°) to the right (φ = +90°) it rises half a pitch
const edge = (r, off) =>
  Array.from({ length: ARC + 1 }, (_, i) => {
    const phi = -Math.PI / 2 + (Math.PI * i) / ARC
    return [r * Math.sin(phi), -(H0 + off + (P * (phi + Math.PI / 2)) / (2 * Math.PI))]
  })
const band = (r, off0, off1) => pts([...edge(r, off0), ...edge(r, off1).reverse()])

const malTiers = R_TIER.map((r, k) => band(r, k * P, k * P + WALL))
const malRamps = R_TIER.map((r, k) => band(r + RAMP_OUT, k * P + WALL, (k + 1) * P))
const TOP = H0 + TURNS * P + P / 2 // where the last ramp ends on the right: the lantern stands on this
// the last turn closes flat under the lantern
const malCap = pts([...edge(R_TIER[4], TURNS * P), [R_TIER[4], -TOP], [-R_TIER[4], -TOP]])
const LANT = 40
const malLantern = pts([[-25, -TOP], [-22, -TOP - LANT], [22, -TOP - LANT], [25, -TOP]])
const malCrown = pts([[-28, -TOP - LANT], [-28, -TOP - LANT - 9], [28, -TOP - LANT - 9], [28, -TOP - LANT]])
const malWindows = [-12, -6, 0, 6, 12]
  .map((x) => `M${x - 2} ${-TOP - 6} V${-TOP - 26} a2 2 0 0 1 4 0 V${-TOP - 6}Z`)
  .join('')
const malPlinthLow = pts([[-150, 0], [-150, -16], [150, -16], [150, 0]])
const malPlinthUp = pts([[-128, -16], [-128, -H0], [128, -H0], [128, -16]])
const malNiches = [-120, -90, -60, -30, 0, 30, 60, 90, 120]
  .map((x) => `M${x - 6} 0 V-6 a6 6 0 0 1 12 0 V0Z`)
  .join('')

// ── its stepping: the right half of the Malwiya's profile as a stair, from the axis outward ──
const rect = (x1, x2, top) => pts([[x1, 0], [x1, -top], [x2, -top], [x2, 0]])
const STEP_SLABS = [
  [150, 16, '#4b4b4b'],
  [128, H0, '#5c5c5c'],
  ...R_TIER.map((r, k) => [r + RAMP_OUT, H0 + (k + 1.5) * P, ['#707070', '#8a8a8a', '#a3a3a3', '#bcbcbc', '#d3d3d3'][k]]),
  [28, TOP + LANT + 9, '#f2f2f2'],
].map(([x, top, fill]) => ({ d: rect(0, x, top), fill }))

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
function Part({ d, stage, at, until = STAGES - 1, from, to, delay = 0, fill = '#fff', dim = 1, ghost }) {
  const on = stage >= at && stage <= until
  return (
    <path
      d={d}
      className="pc-part"
      style={{
        fill,
        opacity: on ? (ghost !== undefined && stage > at ? ghost : dim) : 0,
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

  const wL = PANELS.wingL
  const wR = PANELS.wingR
  const ar = PANELS.arch
  const st = PANELS.steps
  const S = { stage }

  return (
    <figure className="pc" ref={ref}>
      <svg viewBox="-430 -446 860 468" className="pc-svg" role="img" aria-label={ui.conceptAria}>
        {/* 0 · Al-Malwiya, as in the photograph */}
        <Part {...S} d={malPlinthLow} at={0} until={1} ghost={0.13} from="translateY(14px)" fill="#555" />
        <Part {...S} d={malPlinthUp} at={0} until={1} ghost={0.13} from="translateY(14px)" fill="#6d6d6d" />
        <Part {...S} d={malNiches} at={0} until={1} ghost={0.13} from="translateY(14px)" fill="#0b0b0b" />
        {malTiers.map((d, k) => (
          <Part key={`t${k}`} {...S} d={d} at={0} until={1} ghost={0.13} from="translateY(14px)" delay={0.06 * k} fill="#3a3a3a" />
        ))}
        {malRamps.map((d, k) => (
          <Part key={`r${k}`} {...S} d={d} at={0} until={1} ghost={0.13} from="translateY(14px)" delay={0.06 * k} fill="#ececec" />
        ))}
        <Part {...S} d={malCap} at={0} until={1} ghost={0.13} from="translateY(14px)" delay={0.3} fill="#3a3a3a" />
        <Part {...S} d={malLantern} at={0} until={1} ghost={0.13} from="translateY(14px)" delay={0.3} fill="#d9d9d9" />
        <Part {...S} d={malCrown} at={0} until={1} ghost={0.13} from="translateY(14px)" delay={0.3} fill="#f4f4f4" />
        <Part {...S} d={malWindows} at={0} until={1} ghost={0.13} from="translateY(14px)" delay={0.3} fill="#0b0b0b" />

        {/* 1 · only its stepping: the right half of the profile, read as a stair */}
        {STEP_SLABS.map((q, i) => (
          <Part key={`s${i}`} {...S} d={q.d} at={1} until={1} fill={q.fill} delay={0.08 * i} />
        ))}

        {/* 2 · the gateway arch: a recessed pointed portal, as in the photograph */}
        <Part {...S} d={gateFrame} at={2} until={2} from="translateY(14px)" fill="#262626" />
        <Part {...S} d={gateArch1} at={2} until={2} from="translateY(14px)" fill="#4a4a4a" delay={0.1} />
        <Part {...S} d={gateArch2} at={2} until={2} from="translateY(14px)" fill="#7c7c7c" delay={0.2} />
        <Part {...S} d={gateArch} at={2} until={2} from="translateY(14px)" fill="#f2f2f2" delay={0.3} />
        <Part {...S} d={gateDoor} at={2} until={2} from="translateY(14px)" fill="#0b0b0b" delay={0.4} />

        {/* 3 · cut in half along the axis */}
        <Part {...S} d={halfL} at={3} until={3} from="translateX(0px)" to="translateX(-14px)" fill="#f2f2f2" />
        <Part {...S} d={halfR} at={3} until={3} from="translateX(0px)" to="translateX(14px)" fill="#f2f2f2" />

        {/* 4 · the halves take the stepping: the centre arch (the tall step at the axis, then lower ones) */}
        <Part {...S} d={byId(ar, 14)} at={4} from="translateX(130px)" delay={0.3} fill="#a9a9a9" />
        <Part {...S} d={byId(ar, 17)} at={4} from="translateX(-130px)" delay={0.3} fill="#a9a9a9" />
        <Part {...S} d={byId(ar, 12)} at={4} from="translateX(70px)" delay={0.15} fill="#c8c8c8" />
        <Part {...S} d={byId(ar, 16)} at={4} from="translateX(-70px)" delay={0.15} fill="#c8c8c8" />
        <Part {...S} d={byId(ar, 13)} at={4} fill="#f2f2f2" />
        <Part {...S} d={byId(ar, 15)} at={4} fill="#f2f2f2" />
        <Part {...S} d={byId(ar, 66)} at={4} from="translateX(40px)" delay={0.2} fill="#e0e0e0" dim={0.9} />
        <Part {...S} d={byId(ar, 65)} at={4} from="translateX(-40px)" delay={0.2} fill="#e0e0e0" dim={0.9} />

        {/* 5 · mirrored, the stepped halves open out as two wings */}
        <Part {...S} d={byId(wL, 11)} at={5} from="translateX(150px)" delay={0.05} fill="#8b8b8b" />
        <Part {...S} d={byId(wR, 8)} at={5} from="translateX(-150px)" delay={0.05} fill="#8b8b8b" />
        <Part {...S} d={byId(wL, 10)} at={5} from="translateX(220px)" delay={0.2} fill="#a0a0a0" />
        <Part {...S} d={byId(wR, 7)} at={5} from="translateX(-220px)" delay={0.2} fill="#a0a0a0" />
        <Part {...S} d={byId(wL, 9)} at={5} from="translateX(290px)" delay={0.35} fill="#b6b6b6" />
        <Part {...S} d={byId(wR, 6)} at={5} from="translateX(-290px)" delay={0.35} fill="#b6b6b6" />

        {/* 6 · a low base joins them */}
        <Part {...S} d={byId(st, 5)} at={6} from="translateY(26px)" delay={0.1} fill="#3b3b3b" />
        <Part {...S} d={byId(st, 4)} at={6} from="translateY(26px)" delay={0.25} fill="#2a2a2a" />
        <Part {...S} d={byId(st, 3)} at={6} from="translateY(26px)" delay={0.4} fill="#1c1c1c" />
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

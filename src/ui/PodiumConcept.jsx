import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import { PODIUM_PANELS as P } from './podiumPanels'

// How the graduation podium came from the Malwiya and a pointed arch — a light line animation, no words:
//   0  the Malwiya, a form that climbs in tiers          3  the halves take on the stepping (the centre arch)
//   1  a pointed arch                                    4  the stepped halves open out as two wings
//   2  the arch is cut in half along its axis            5  a low base joins them: the podium
// The last stage uses the real outlines of the Rhino model (podiumPanels.js). 1 unit = 1 cm.

const STAGES = 6
const HOLD = [3000, 2600, 2800, 3000, 3000, 4600] // ms each stage stays on screen

const pts = (a) => 'M' + a.map(([x, y]) => `${x} ${y}`).join(' L') + 'Z'
const mirror = (a) => a.map(([x, y]) => [-x, y])

// ── the Malwiya: left edge of the silhouette, bottom → top (each tier narrows, with a ledge between) ──
const MAL_LEFT = [
  [-150, -18], [-132, -92], [-118, -92], [-102, -164], [-90, -164], [-76, -232], [-66, -232],
  [-55, -296], [-47, -296], [-39, -352], [-30, -352], [-28, -408], [-33, -408], [-33, -416],
]
const malSilhouette = (() => {
  const r = MAL_LEFT.slice().reverse()
  return pts([...MAL_LEFT, ...mirror(r)])
})()
// the tier tops, drawn as the front edge of a round ledge
const LEDGES = [[132, -92], [102, -164], [76, -232], [55, -296], [39, -352], [28, -408]]
const malLedges = LEDGES.map(([r, y]) => `M${-r} ${y} A${r} ${(r * 0.11).toFixed(1)} 0 0 0 ${r} ${y}`).join(' ')
const malBase = 'M-176 0 V-18 H176 V0' + [-140, -105, -70, -35, 0, 35, 70, 105, 140].map((x) => `M${x - 7} 0 V-7 a7 7 0 0 1 14 0 V0`).join('')
const malWindows = [-18, -9, 0, 9, 18].map((x) => `M${x - 2.6} -380 V-391 a2.6 2.6 0 0 1 5.2 0 V-380`).join('')

// ── the arch: left half of the tallest wing panel, moved so its axis is at x = 0 ──
const HALF = [[-69.2, 0], [-69.3, -343.2], [-68.3, -350.8], [-65.3, -358.2], [-57.5, -367], [0, -400.5], [0, 0]]
const halfL = pts(HALF)
const halfR = pts(mirror(HALF))
const archFull = pts([...HALF.slice(0, 6), ...mirror(HALF.slice(0, 6)).reverse()])

const byId = (list, id) => list.find((q) => q.id === id).d

// One outline: it fades (and slides) in at stage `at`, and out after stage `until`. From stage `fillAt` it takes a faint fill.
function Part({ d, stage, at, until = STAGES - 1, from, to, fillAt = 5, fill = 0.1, delay = 0, w = 1.25, dim = 1 }) {
  const on = stage >= at && stage <= until
  return (
    <path
      d={d}
      className="pc-part"
      style={{
        opacity: on ? dim : 0,
        transform: stage < at ? from || to || 'none' : to || 'none',
        fillOpacity: on && stage >= fillAt ? fill : 0,
        strokeWidth: w,
        transitionDelay: on ? `${delay}s` : '0s',
      }}
    />
  )
}

export default function PodiumConcept() {
  const { ui } = useI18n()
  const [stage, setStage] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? STAGES - 1 : 0,
  )
  const [paused, setPaused] = useState(false)
  const [seen, setSeen] = useState(false)
  const ref = useRef(null)
  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  )

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
      <svg viewBox="-430 -440 860 462" className="pc-svg" role="img" aria-label={ui.conceptAria}>
        <path d="M-420 0 H420" className="pc-ground" />

        {/* 0 · the Malwiya */}
        <g className="pc-g">
          <Part {...S} d={malSilhouette} at={0} until={0} from="translateY(14px)" />
          <Part {...S} d={malLedges} at={0} until={0} from="translateY(14px)" w={1} dim={0.7} />
          <Part {...S} d={malBase} at={0} until={0} from="translateY(14px)" w={1} dim={0.8} />
          <Part {...S} d={malWindows} at={0} until={0} from="translateY(14px)" w={1} dim={0.8} />
        </g>

        {/* 1 · the arch   2 · cut in half */}
        <Part {...S} d={archFull} at={1} until={1} from="translateY(14px)" />
        <path d="M0 -432 V6" className="pc-axis" style={{ opacity: stage >= 2 && stage <= 3 ? 1 : 0 }} />
        <Part {...S} d={halfL} at={2} until={2} from="translateX(0px)" to="translateX(-12px)" />
        <Part {...S} d={halfR} at={2} until={2} from="translateX(0px)" to="translateX(12px)" />

        {/* 3 · the halves take on the stepping: the centre arch (tall step at the axis, then lower ones) */}
        <Part {...S} d={byId(ar, 13)} at={3} fill={0.1} />
        <Part {...S} d={byId(ar, 15)} at={3} fill={0.1} />
        <Part {...S} d={byId(ar, 12)} at={3} from="translateX(70px)" delay={0.15} fill={0.08} />
        <Part {...S} d={byId(ar, 16)} at={3} from="translateX(-70px)" delay={0.15} fill={0.08} />
        <Part {...S} d={byId(ar, 14)} at={3} from="translateX(130px)" delay={0.3} fill={0.06} />
        <Part {...S} d={byId(ar, 17)} at={3} from="translateX(-130px)" delay={0.3} fill={0.06} />
        <Part {...S} d={byId(ar, 66)} at={3} from="translateX(40px)" delay={0.2} w={0.9} dim={0.55} fill={0.05} />
        <Part {...S} d={byId(ar, 65)} at={3} from="translateX(-40px)" delay={0.2} w={0.9} dim={0.55} fill={0.05} />

        {/* 4 · the stepped halves open out as two wings */}
        <Part {...S} d={byId(wL, 11)} at={4} from="translateX(150px)" delay={0.05} fill={0.16} />
        <Part {...S} d={byId(wR, 8)} at={4} from="translateX(-150px)" delay={0.05} fill={0.16} />
        <Part {...S} d={byId(wL, 10)} at={4} from="translateX(220px)" delay={0.2} fill={0.16} />
        <Part {...S} d={byId(wR, 7)} at={4} from="translateX(-220px)" delay={0.2} fill={0.16} />
        <Part {...S} d={byId(wL, 9)} at={4} from="translateX(290px)" delay={0.35} fill={0.16} />
        <Part {...S} d={byId(wR, 6)} at={4} from="translateX(-290px)" delay={0.35} fill={0.16} />

        {/* 5 · a low base joins them */}
        <Part {...S} d={byId(st, 3)} at={5} from="translateY(26px)" delay={0.1} fill={0.07} />
        <Part {...S} d={byId(st, 4)} at={5} from="translateY(26px)" delay={0.25} fill={0.07} />
        <Part {...S} d={byId(st, 5)} at={5} from="translateY(26px)" delay={0.4} fill={0.07} />
      </svg>

      <div className="pc-dots" role="group" aria-label={ui.conceptStep}>
        {Array.from({ length: STAGES }, (_, i) => (
          <button
            key={i}
            type="button"
            className={`pc-dot${i === stage ? ' is-on' : ''}`}
            aria-label={`${ui.conceptStep} ${i + 1}`}
            aria-current={i === stage ? 'step' : undefined}
            onClick={() => pick(i)}
          />
        ))}
      </div>
    </figure>
  )
}

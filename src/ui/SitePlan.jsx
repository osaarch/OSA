import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import plan from '../assets/plans/four-gates-site.webp'

// Four Gates Cultural Complex — how the shrine's four gates were taken and set down across the site.
// The aerial view is drawn as hatched lines (src/assets/plans/four-gates-site.webp) and the animation
// runs over it:  0 the site and the shrine · 1 its four gates · 2 the gates travel and land as four squares
// · 3 each square opens a part of the programme · 4 the axis and routes connect them back to the shrine.
// Coordinates are in the picture's own pixels (1047 × 1080); K scales them to the 1400-wide drawing.

const VW = 1400
const VH = 1444
const K = VW / 1047
const STAGES = 5
const HOLD = [3800, 3600, 4600, 4600, 5600]

const pt = ([x, y]) => [x * K, y * K]
const path = (a) => 'M' + a.map((p) => pt(p).map((n) => n.toFixed(0)).join(' ')).join(' L') + 'Z'
const line = (a) => 'M' + a.map((p) => pt(p).map((n) => n.toFixed(0)).join(' ')).join(' L')
const pct = ([x, y]) => ({ left: `${((x * K) / VW) * 100}%`, top: `${((y * K) / VH) * 100}%` })

// the shrine: the dome, and a gate in the middle of each of its four sides
const DOME = [632, 62]
const SHRINE = [[545, 2], [722, 2], [722, 165], [545, 165]]
const GATES = { n: [632, 4], e: [721, 62], s: [632, 163], w: [546, 62] }

// the four squares, traced on the aerial view; each is one gate set down. `from` is the gate it came from.
const SQUARES = [
  { key: 'entertainment', from: 'n', pts: [[365, 280], [430, 347], [366, 415], [306, 347]], c: [367, 347], label: [366, 436] },
  { key: 'culture', from: 'e', pts: [[680, 285], [803, 222], [872, 317], [770, 377]], c: [781, 300], label: [790, 402] },
  { key: 'hotel', from: 'w', pts: [[246, 838], [300, 877], [246, 918], [192, 877]], c: [246, 878], label: [246, 940] },
  { key: 'education', from: 's', pts: [[678, 684], [716, 730], [671, 768], [632, 722]], c: [674, 726], label: [674, 790] },
]

// the routes that tie the squares back to the shrine along the water axis
const AXIS = [[632, 166], [592, 380], [553, 590], [521, 905]]
const BRANCHES = [
  [[592, 350], [430, 347]],
  [[600, 305], [680, 300]],
  [[522, 878], [300, 877]],
  [[540, 724], [632, 722]],
]

// a pointed gateway arch, centred on (0, 0)
const GATE = 'M-13 22V-5Q-13 -14 0 -26Q13 -14 13 -5V22Z'

export default function SitePlan({ d }) {
  const { ui } = useI18n()
  const reduced = useMemo(
    () => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches),
    [],
  )
  const [stage, setStage] = useState(reduced ? STAGES - 1 : 0)
  const [paused, setPaused] = useState(false)
  const [seen, setSeen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) {
      setSeen(true)
      return
    }
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.3 })
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

  const labels = d.labels || {}
  const landed = stage >= 2
  const dim = stage >= 2 ? 0.34 : 1

  return (
    <figure className="sp" ref={ref}>
      <div className="sp-frame">
        <img className="sp-plan" src={plan} width={VW} height={VH} alt="" style={{ opacity: dim }} decoding="async" />

        <svg viewBox={`0 0 ${VW} ${VH}`} className="sp-svg" role="img" aria-label={d.aria}>
          {/* the shrine: a frame, the dome, and its four gates */}
          <path className="sp-frame-line" d={path(SHRINE)} style={{ opacity: stage === 1 ? 1 : 0.0 }} />
          <circle
            className="sp-dome"
            cx={DOME[0] * K}
            cy={DOME[1] * K}
            r={36 * K}
            style={{ opacity: stage <= 1 ? 1 : 0.55 }}
          />

          {/* the four squares, once the gates have landed */}
          {SQUARES.map((q, i) => (
            <path
              key={q.key}
              d={path(q.pts)}
              className="sp-square"
              style={{ opacity: landed ? 1 : 0, transitionDelay: landed ? `${0.9 + i * 0.18}s` : '0s' }}
            />
          ))}

          {/* routes, drawn from the shrine down the axis and out to each square */}
          <path
            className="sp-route"
            d={line(AXIS)}
            pathLength="1"
            style={{ strokeDashoffset: stage >= 4 ? 0 : 1, transitionDelay: stage >= 4 ? '0.1s' : '0s' }}
          />
          {BRANCHES.map((b, i) => (
            <path
              key={i}
              className="sp-route"
              d={line(b)}
              pathLength="1"
              style={{ strokeDashoffset: stage >= 4 ? 0 : 1, transitionDelay: stage >= 4 ? `${0.9 + i * 0.15}s` : '0s' }}
            />
          ))}

          {/* the four gates: at the shrine's sides first, then each carried to its square */}
          {SQUARES.map((q, i) => {
            const [gx, gy] = GATES[q.from]
            const [cx, cy] = q.c
            const dx = (gx - cx) * K
            const dy = (gy - cy) * K
            const on = stage >= 1
            return (
              <g key={q.key} transform={`translate(${(cx * K).toFixed(1)} ${(cy * K).toFixed(1)})`}>
                <g
                  className="sp-gate-wrap"
                  style={{
                    transform: landed ? 'translate(0px, 0px) scale(1.5)' : `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(1)`,
                    opacity: on ? (stage >= 3 ? 0.9 : 1) : 0,
                    transitionDelay: landed ? `${i * 0.18}s` : on ? `${i * 0.1}s` : '0s',
                  }}
                >
                  <path className="sp-gate" d={GATE} />
                </g>
              </g>
            )
          })}
        </svg>

        {/* the names: the shrine from the start, the four parts of the programme once the squares are set */}
        <span className="sp-name sp-name-shrine" style={pct([548, 62])}>
          {(labels.shrine || []).map((ln, i) => (
            <span key={i}>{ln}</span>
          ))}
        </span>
        {SQUARES.map((q, i) => (
          <span
            key={q.key}
            className="sp-name"
            style={{ ...pct(q.label), opacity: stage >= 3 ? 1 : 0, transitionDelay: stage >= 3 ? `${0.25 + i * 0.12}s` : '0s' }}
          >
            {(labels[q.key] || []).map((ln, k) => (
              <span key={k}>{ln}</span>
            ))}
          </span>
        ))}
      </div>

      <div className="pc-cap" aria-live="polite">
        {d.stages.map((s, i) => (
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
            aria-label={d.stages[i]?.title || ui.conceptStep}
            aria-current={i === stage ? 'step' : undefined}
            onClick={() => pick(i)}
          />
        ))}
      </div>
    </figure>
  )
}

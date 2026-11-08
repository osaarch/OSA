import { useId } from 'react'

// Vector diagrams of the Four Gates Cultural Complex (src/content.js → projects → four-gates).
// They are drawn with CSS classes (see `.gd-*` in styles.css), so they follow the site's ink and
// background colours. Every visible label and every accessibility text comes from content.js,
// which keeps both languages in one place.

// One line of text, or several lines centred on (x, cy).
function Label({ x, cy, lines }) {
  const lh = 13
  const y0 = cy + 3.7 - ((lines.length - 1) * lh) / 2
  return (
    <text x={x} y={y0}>
      {lines.map((ln, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : lh}>
          {ln}
        </tspan>
      ))}
    </text>
  )
}

// The conceptual programme: the shrine in the middle, four open plazas, four branches.
// d = { title, desc, labels: { hotel, entertainment, shrine, culture, education } } (each a list of lines)
export function ProgrammeDiagram({ d }) {
  const id = useId()
  return (
    <svg className="gd" viewBox="0 0 420 296" role="img" aria-labelledby={`${id}t ${id}d`}>
      <title id={`${id}t`}>{d.title}</title>
      <desc id={`${id}d`}>{d.desc}</desc>
      <path className="gd-route" d="M210 63V112M210 184V233M129 148H174M246 148H291" />
      <g className="gd-zone">
        <rect x="153" y="24" width="114" height="39" />
        <rect x="16" y="128" width="113" height="40" />
        <rect x="153" y="233" width="114" height="39" />
        <rect x="291" y="128" width="113" height="40" />
      </g>
      <g className="gd-core">
        <rect x="174" y="112" width="72" height="72" />
        <rect x="200" y="78" width="20" height="20" />
        <rect x="200" y="198" width="20" height="20" />
        <rect x="142" y="138" width="20" height="20" />
        <rect x="258" y="138" width="20" height="20" />
      </g>
      <g className="gd-text">
        <Label x={210} cy={43.5} lines={d.labels.hotel} />
        <Label x={72.5} cy={148} lines={d.labels.entertainment} />
        <Label x={210} cy={148} lines={d.labels.shrine} />
        <Label x={347.5} cy={148} lines={d.labels.culture} />
        <Label x={210} cy={252.5} lines={d.labels.education} />
      </g>
    </svg>
  )
}

// The three stages of the composition (n = 0, 1, 2).
export function StageDiagram({ n, alt }) {
  const id = useId()
  return (
    <svg className="gd" viewBox="0 0 300 230" role="img" aria-labelledby={`${id}t`}>
      <title id={`${id}t`}>{alt}</title>
      {n === 0 && (
        <>
          <rect className="gd-mass" x="110" y="75" width="80" height="80" />
          <path
            className="gd-core"
            d="M141 74h18v11h-18z M141 145h18v11h-18z M109 106h11v18h-11z M180 106h11v18h-11z"
          />
        </>
      )}
      {n === 1 && (
        <>
          <rect className="gd-mass" x="110" y="75" width="80" height="80" />
          <path className="gd-route" d="M150 56v18 M150 156v18 M90 115h19 M191 115h19" />
          <path
            className="gd-core"
            d="M141 74h18v11h-18z M141 145h18v11h-18z M109 106h11v18h-11z M180 106h11v18h-11z"
          />
          <path className="gd-plaza" d="M129 21h42v35h-42z M129 174h42v35h-42z M55 94h35v42H55z M210 94h35v42h-35z" />
        </>
      )}
      {n === 2 && (
        <>
          <rect className="gd-mass" x="120" y="85" width="60" height="60" />
          <rect className="gd-dash" x="78" y="45" width="144" height="140" />
          <path className="gd-route" d="M150 37v48 M150 145v48 M67 115h53 M180 115h53" />
          <path className="gd-plaza" d="M139 53h22v22h-22z M139 155h22v22h-22z M88 104h22v22H88z M190 104h22v22h-22z" />
          <path
            className="gd-block"
            d="M104 15h28v22h-28z M135 15h30v22h-30z M168 15h28v22h-28z M104 193h28v22h-28z M135 193h30v22h-30z M168 193h28v22h-28z M36 71h31v28H36z M36 101h31v28H36z M36 131h31v28H36z M233 71h31v28h-31z M233 101h31v28h-31z M233 131h31v28h-31z"
          />
        </>
      )}
    </svg>
  )
}

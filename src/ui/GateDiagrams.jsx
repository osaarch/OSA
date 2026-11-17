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

// a diamond (a square on its corner) centred on (x, y) with half-diagonal r
const dia = (x, y, r) => `M${x - r} ${y}L${x} ${y - r}L${x + r} ${y}L${x} ${y + r}Z`

// The conceptual programme: the shrine of Imam al-Hadi at the head, an axis down from it, four open plazas
// (one for each of its gates), four branches.
// d = { title, desc, labels: { hotel, entertainment, shrine, culture, education } } (each a list of lines)
export function ProgrammeDiagram({ d }) {
  const id = useId()
  return (
    <svg className="gd" viewBox="0 0 420 300" role="img" aria-labelledby={`${id}t ${id}d`}>
      <title id={`${id}t`}>{d.title}</title>
      <desc id={`${id}d`}>{d.desc}</desc>
      <path className="gd-route" d="M210 58V284M108 128H130M290 128H310M108 218H130M290 218H310M170 128H250M170 218H250" />
      <g className="gd-zone">
        <rect x="8" y="108" width="100" height="40" />
        <rect x="312" y="108" width="100" height="40" />
        <rect x="8" y="198" width="100" height="40" />
        <rect x="312" y="198" width="100" height="40" />
      </g>
      <g className="gd-plaza">
        <path d={dia(150, 128, 20)} />
        <path d={dia(270, 128, 20)} />
        <path d={dia(150, 218, 20)} />
        <path d={dia(270, 218, 20)} />
      </g>
      <g className="gd-core">
        <rect x="140" y="10" width="140" height="48" />
        <rect x="200" y="5.5" width="20" height="9" />
        <rect x="200" y="53.5" width="20" height="9" />
        <rect x="135.5" y="25" width="9" height="18" />
        <rect x="275.5" y="25" width="9" height="18" />
      </g>
      <g className="gd-text">
        <Label x={210} cy={34} lines={d.labels.shrine} />
        <Label x={58} cy={128} lines={d.labels.education} />
        <Label x={362} cy={128} lines={d.labels.culture} />
        <Label x={58} cy={218} lines={d.labels.hotel} />
        <Label x={362} cy={218} lines={d.labels.entertainment} />
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
          <circle className="gd-ring" cx="150" cy="115" r="17" />
          <path
            className="gd-core"
            d="M141 74h18v11h-18z M141 145h18v11h-18z M109 106h11v18h-11z M180 106h11v18h-11z"
          />
        </>
      )}
      {n === 1 && (
        <>
          <path className="gd-dash" d="M150 46V218" />
          <rect className="gd-mass" x="117" y="12" width="66" height="34" />
          <path className="gd-core" d="M141 10h18v8h-18z M141 40h18v8h-18z M113 21h8v16h-8z M179 21h8v16h-8z" />
          <path className="gd-plaza" d={dia(80, 112, 20) + dia(220, 112, 20) + dia(80, 180, 20) + dia(220, 180, 20)} />
        </>
      )}
      {n === 2 && (
        <>
          <rect className="gd-dash" x="20" y="68" width="260" height="154" />
          <path className="gd-route" d="M150 46V222M100 112H150M200 112H150M100 180H150M200 180H150" />
          <rect className="gd-mass" x="117" y="12" width="66" height="34" />
          <path className="gd-core" d="M141 10h18v8h-18z M141 40h18v8h-18z M113 21h8v16h-8z M179 21h8v16h-8z" />
          <path className="gd-plaza" d={dia(80, 112, 20) + dia(220, 112, 20) + dia(80, 180, 20) + dia(220, 180, 20)} />
          <path
            className="gd-block"
            d="M28 82h26v60H28z M246 82h26v60h-26z M28 150h26v60H28z M246 150h26v60h-26z M62 82h6v22h-6z M232 82h6v22h-6z M62 188h6v22h-6z M232 188h6v22h-6z"
          />
        </>
      )}
    </svg>
  )
}

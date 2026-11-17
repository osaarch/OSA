// A small arrow drawn as a shape, so it is the same on every device (Century Gothic has no arrow
// glyph, and each phone would otherwise substitute its own). `.arr` / `.arr-back` are mirrored in
// Arabic by the stylesheet; `up` is never mirrored.
const PATHS = {
  right: ['0 0 16 10', 'M0 5H14.5M10.2 0.8L14.6 5L10.2 9.2', '1.25em', '0.78em'],
  left: ['0 0 16 10', 'M16 5H1.5M5.8 0.8L1.4 5L5.8 9.2', '1.25em', '0.78em'],
  up: ['0 0 10 16', 'M5 16V1.5M0.8 5.8L5 1.4L9.2 5.8', '0.78em', '1.25em'],
  down: ['0 0 10 16', 'M5 0V14.5M0.8 10.2L5 14.6L9.2 10.2', '0.78em', '1.25em'],
}
export function Arrow({ dir = 'right', className = 'arr' }) {
  const [box, d, w, h] = PATHS[dir] || PATHS.right
  return (
    <svg className={`arrow ${className}`} viewBox={box} width={w} height={h} aria-hidden="true" focusable="false">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="square" />
    </svg>
  )
}

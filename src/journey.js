// Shared, mutable scroll-journey state. Kept outside React on purpose: it is
// written every frame by the render loop and read by the camera, the lights and
// the DOM overlays without triggering a single React re-render.

export const SPACER_VH = 800 // scroll length of the 3D journey, in viewport heights

export const journey = {
  target: 0, // raw scroll progress 0..1 (what the scrollbar says)
  current: 0, // spring-damped progress 0..1 (what the camera uses)
  velocity: 0,
  dirty: true,
}

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
export const lerp = (a, b, t) => a + (b - a) * t
export const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
export const smootherstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a))
  return t * t * t * (t * (t * 6 - 15) + 10)
}

export function readScrollProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight
  if (max <= 1) return 0
  const y = window.scrollY
  if (y >= max - 1) return 1
  return clamp(y / max)
}

export function scrollMax() {
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
}

// Critically damped spring: velocity stays continuous when the wheel / finger
// changes direction, so reversing the journey is as smooth as playing it.
export function stepJourney(dt, omega = 7.4) {
  const d = Math.min(dt, 1 / 20)
  const sub = 3
  const h = d / sub
  let x = journey.current
  let v = journey.velocity
  for (let i = 0; i < sub; i++) {
    const a = omega * omega * (journey.target - x) - 2 * omega * v
    v += a * h
    x += v * h
  }
  x = clamp(x)
  if (Math.abs(journey.target - x) < 1e-5 && Math.abs(v) < 1e-4) {
    x = journey.target
    v = 0
  }
  const moved = x !== journey.current
  journey.current = x
  journey.velocity = v
  return moved
}

// Monotone cubic (Fritsch–Carlson) interpolation through keyframes: C1-smooth,
// never overshoots, so the camera never wobbles between keyframes.
export function monotone(xs, ys, endSlopes = 0) {
  const n = xs.length
  const d = []
  const m = new Array(n).fill(0)
  for (let i = 0; i < n - 1; i++) d[i] = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i])
  m[0] = endSlopes ? d[0] : 0
  m[n - 1] = endSlopes ? d[n - 2] : 0
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0
      m[i + 1] = 0
    } else {
      const a = m[i] / d[i]
      const b = m[i + 1] / d[i]
      const s = a * a + b * b
      if (s > 9) {
        const t = 3 / Math.sqrt(s)
        m[i] = t * a * d[i]
        m[i + 1] = t * b * d[i]
      }
    }
  }
  return (x) => {
    x = clamp(x, xs[0], xs[n - 1])
    let i = 0
    while (i < n - 2 && x > xs[i + 1]) i++
    const h = xs[i + 1] - xs[i]
    const t = (x - xs[i]) / h
    const t2 = t * t
    const t3 = t2 * t
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * h * m[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * h * m[i + 1]
    )
  }
}

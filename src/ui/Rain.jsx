import { useEffect, useRef } from 'react'
import { night, onRainZone, rainZone, stepNight, useNight } from '../night'

// Rain on the screen (night mode): three depths of slanted streaks that fall faster and
// brighter the nearer they are. A plain 2D canvas over the scene. It only falls during the cinematic
// journeys (the Malwiya, the stadium) — `rainZone` is 0 on every other page and once the screen goes
// black — and it only runs while there is rain to draw.
const LAYERS = [
  { n: 0.45, len: 0.022, speed: 0.9, w: 0.7, a: 0.16 },
  { n: 0.35, len: 0.04, speed: 1.35, w: 1, a: 0.26 },
  { n: 0.2, len: 0.07, speed: 1.9, w: 1.4, a: 0.38 },
]
const SLANT = 0.2 // horizontal travel per unit of fall

export default function Rain() {
  const ref = useRef(null)
  const isNight = useNight()

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let drops = []
    let W = 0
    let H = 0
    let dpr = 1
    let last = 0

    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = window.innerWidth
      H = window.innerHeight
      cv.width = Math.round(W * dpr)
      cv.height = Math.round(H * dpr)
      const total = Math.round(Math.min(260, Math.max(80, (W * H) / 7500)) * (reduce ? 0.5 : 1))
      drops = []
      LAYERS.forEach((L, li) => {
        const c = Math.round(total * L.n)
        for (let i = 0; i < c; i++) drops.push({ li, x: Math.random() * (W + H * SLANT) - H * SLANT * 0.5, y: Math.random() * H, k: 0.7 + Math.random() * 0.6 })
      })
    }

    const frame = (now) => {
      raf = 0
      const v = stepNight() * rainZone.v
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016)
      last = now
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      if (v < 0.004 && (!night.on || rainZone.target === 0)) return // dry again: stop
      ctx.lineCap = 'round'
      for (let li = 0; li < LAYERS.length; li++) {
        const L = LAYERS[li]
        ctx.lineWidth = L.w
        ctx.strokeStyle = `rgba(222, 168, 108, ${(L.a * v).toFixed(3)})`
        ctx.beginPath()
        for (const d of drops) {
          if (d.li !== li) continue
          const len = L.len * H * d.k
          d.y += L.speed * H * 0.9 * d.k * dt
          d.x -= L.speed * H * 0.9 * d.k * dt * SLANT
          if (d.y - len > H) {
            d.y = -len
            d.x = Math.random() * (W + H * SLANT) - H * SLANT * 0.5 + H * SLANT
          }
          ctx.moveTo(d.x, d.y)
          ctx.lineTo(d.x + len * SLANT, d.y - len)
        }
        ctx.stroke()
      }
      raf = requestAnimationFrame(frame)
    }
    const start = () => {
      if (!raf) {
        last = 0
        raf = requestAnimationFrame(frame)
      }
    }

    build()
    window.addEventListener('resize', build)
    const off = onRainZone(() => {
      if (night.on && rainZone.target > 0) start()
    })
    if (isNight && rainZone.target > 0) start()
    else if (night.v * rainZone.v > 0.004) start()
    return () => {
      off()
      window.removeEventListener('resize', build)
      cancelAnimationFrame(raf)
    }
  }, [isNight])

  return <canvas ref={ref} className="rain" aria-hidden="true" />
}

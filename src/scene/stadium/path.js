import { monotone, lerp } from '../../journey'

// ─────────────────────────────────────────────────────────────────────────────
//  THE STADIUM'S CAMERA PATH — a pure function of progress u ∈ [0,1], so scrolling
//  back replays it exactly in reverse. The model is centred on the bowl (x=0, z=0);
//  the roof planes rise to ~100 m and the whole composition spans ~600 m.
//
//  Position = (sinθ · r, h, cosθ · r)      Look-at = (0, ty, 0)
//
//    0.00 – 0.10   far, long lens: the whole site — river, plazas, palm groves — small in the haze,
//                  then drawing in
//    0.10 – 0.62   the approach, in one full turn around the stadium
//    0.62 – 0.74   closest pass, level with the tilted roof planes
//    0.74 – 1.00   a climb into the sky until the camera looks straight down into the
//                  bowl — and the light goes out
// ─────────────────────────────────────────────────────────────────────────────
const U = [0.0, 0.1, 0.22, 0.36, 0.5, 0.62, 0.74, 0.85, 0.94, 1.0]
const R = [3300, 1200, 850, 570, 400, 300, 220, 140, 40, 10]
const H = [700, 250, 195, 140, 108, 96, 150, 280, 385, 410]
const TY = [18, 20, 24, 28, 32, 34, 28, 10, 0, 0]
const FOV = [23, 25, 28, 32, 36, 40, 44, 50, 50, 48]

const lnR = monotone(
  U,
  R.map((r) => Math.log(r)),
)
const hOf = monotone(U, H)
const tyOf = monotone(U, TY)
const fovOf = monotone(U, FOV)

// the journey starts facing the lettering on the tall facade (the −z side of the model)
export const ORBIT_START = 3.41
export const ORBIT_TOTAL = Math.PI * 2 + 0.35

export function orbitAngle(u) {
  const s = u * u * (3 - 2 * u)
  return ORBIT_START + ORBIT_TOTAL * lerp(u, s, 0.62)
}

export function samplePath(u, out) {
  const r = Math.exp(lnR(u))
  const th = orbitAngle(u)
  out.theta = th
  out.r = r
  out.x = Math.sin(th) * r
  out.z = Math.cos(th) * r
  out.y = hOf(u)
  out.ty = tyOf(u)
  out.fov = fovOf(u)
  return out
}

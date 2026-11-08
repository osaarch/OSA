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
//    0.74 – 0.95   the camera lets go of the building: it rises and draws back to an aerial view over
//                  the whole site — both stadiums, the river, the plazas, the palm groves
//    0.95 – 0.985  the light goes out over the site, and the logo comes up out of the black
// ─────────────────────────────────────────────────────────────────────────────
const U = [0.0, 0.1, 0.22, 0.36, 0.5, 0.62, 0.74, 0.85, 0.94, 1.0]
const R = [1500, 1200, 850, 570, 400, 300, 220, 380, 1000, 1200]
const H = [290, 250, 195, 140, 108, 96, 150, 380, 950, 1050]
const TY = [18, 20, 24, 28, 32, 34, 28, 16, 0, 0]
// at the end the camera looks over the whole site, between the two stadiums, not at the bowl
const TX = [0, 0, 0, 0, 0, 0, 0, 0, -140, -260]
const TZ = [0, 0, 0, 0, 0, 0, 0, 0, 10, 20]
const FOV = [24, 25, 28, 32, 36, 40, 44, 46, 40, 38]

const lnR = monotone(
  U,
  R.map((r) => Math.log(r)),
)
const hOf = monotone(U, H)
const tyOf = monotone(U, TY)
const txOf = monotone(U, TX)
const tzOf = monotone(U, TZ)
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
  out.tx = txOf(u)
  out.tz = tzOf(u)
  out.fov = fovOf(u)
  return out
}

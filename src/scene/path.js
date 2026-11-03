import { monotone, lerp, smoothstep } from '../journey'

// ─────────────────────────────────────────────────────────────────────────────
//  THE CAMERA PATH
//  A single continuous 3D curve, evaluated as a pure function of progress u∈[0,1].
//  Because it is a pure function, scrolling backwards replays it exactly in reverse.
//
//  The tower's vertical axis is the world Y axis (x=0, z=0). The model is ~48.5 m
//  tall on a 41 m plinth, so every number below is in real metres.
//
//  Position  = (sinθ · r, h, cosθ · r)        r = horizontal distance from the axis
//  Look-at   = (0, ty, 0)                      ty = height of the point we look at
// ─────────────────────────────────────────────────────────────────────────────

const U = [0.0, 0.1, 0.24, 0.4, 0.56, 0.7, 0.84, 1.0]

// distance from the axis (log-interpolated → the approach feels perceptually even)
const R = [1250, 960, 600, 320, 176, 104, 72, 60]
const H = [128, 120, 100, 74, 48, 32, 20, 11]
const TY = [20, 21, 23, 26, 28, 31, 35, 39]
const FOV = [24, 25, 29, 33, 38, 43, 48, 52]

const lnR = monotone(
  U,
  R.map((r) => Math.log(r)),
)
const hOf = monotone(U, H)
const tyOf = monotone(U, TY)
const fovOf = monotone(U, FOV)

export const ORBIT_START = -0.62 // radians, where the camera begins around the tower
export const ORBIT_TOTAL = Math.PI * 2 + 0.42 // a full 360° plus a little more

// Orbit angle as a function of progress. A blend of linear and smoothstep: the
// camera drifts into the orbit, sweeps through the middle, settles at the end.
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

// The monument slides off-centre during the last stretch so that the left side of
// the screen is left free for OSA / WORKS. Returned as a fraction of the viewport.
export function lensShift(u) {
  return smoothstep(0.78, 1.0, u)
}

import { Color } from 'three'
import { lerp, smoothstep } from '../../journey'

// ─────────────────────────────────────────────────────────────────────────────
//  THE STADIUM'S COLOUR SCRIPT      golden dust  →  dusk  →  red night  →  black
//  The same renders the project is shown with: a warm haze over the river by day,
//  a black sky with the stadium glowing red from within by night.
// ─────────────────────────────────────────────────────────────────────────────
const c = (hex) => new Color(hex)

const SKY_H = [c('#f0d2a0'), c('#9a6a58'), c('#130c0c')]
const SKY_Z = [c('#cfae86'), c('#3b2b36'), c('#000000')]
const SUN = [c('#ffd9a0'), c('#e8a070'), c('#8a5a50')]
const HEMI_SKY = [c('#f3deb8'), c('#8a6a68'), c('#2a1416')]
const HEMI_GR = [c('#bfa27a'), c('#4a3a36'), c('#140a0a')]

const tmp = new Color()
function tri(set, dusk, night, out) {
  tmp.copy(set[0]).lerp(set[1], dusk)
  out.copy(tmp).lerp(set[2], night)
  return out
}

export function createGrade() {
  return {
    dusk: 0,
    night: 0,
    black: 0,
    crowd: 0,
    skyHorizon: new Color(),
    skyZenith: new Color(),
    fog: new Color(),
    fogDensity: 0.0004,
    sunColor: new Color(),
    sunIntensity: 0,
    sunElevation: 0.3,
    hemiSky: new Color(),
    hemiGround: new Color(),
    hemiIntensity: 0,
    fillIntensity: 0,
    glow: 1,
    dust: 1,
    redLight: 0,
  }
}

export function gradeAt(u, g) {
  const dusk = smoothstep(0.3, 0.66, u)
  const night = smoothstep(0.58, 0.88, u)
  const black = smoothstep(0.93, 0.995, u)
  const live = 1 - black
  g.dusk = dusk
  g.night = night
  g.black = black

  tri(SKY_H, dusk, night, g.skyHorizon).multiplyScalar(live)
  tri(SKY_Z, dusk, night, g.skyZenith).multiplyScalar(live)
  g.fog.copy(g.skyHorizon).multiplyScalar(0.96)
  g.fogDensity = lerp(0.00042, 0.00072, dusk) + night * 0.0007

  tri(SUN, dusk, night, g.sunColor)
  const sunLeft = Math.pow(1 - night, 1.3)
  g.sunIntensity = lerp(3.4, 1.7, dusk) * sunLeft * live
  g.sunElevation = lerp(0.36, 0.2, smoothstep(0.1, 0.6, u))

  tri(HEMI_SKY, dusk, night, g.hemiSky)
  tri(HEMI_GR, dusk, night, g.hemiGround)
  g.hemiIntensity = (lerp(0.9, 0.38, dusk) * Math.pow(1 - night, 1.5) + 0.07 * night) * live
  g.fillIntensity = lerp(0.3, 0.1, dusk) * sunLeft * live
  g.glow = (1 - night) * live
  g.dust = (1 - 0.75 * smoothstep(0.35, 0.8, u)) * live

  g.redLight = smoothstep(0.5, 0.82, u) * live // the red light spilling from the stadium
  g.crowd = smoothstep(0.76, 0.9, u) * live
  return g
}

// the sun keeps a constant angle to the camera: raking light from the side, always
export const sunAzimuth = (theta, u) => theta + lerp(1.05, 0.7, u)

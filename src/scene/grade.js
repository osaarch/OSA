import { Color } from 'three'
import { clamp, lerp, smoothstep } from '../journey'

// ─────────────────────────────────────────────────────────────────────────────
//  THE COLOUR SCRIPT          Sandstone Beige  →  Ember  →  Pure Black
//  One function of progress u. Everything in the world (sky, fog, sun, fill,
//  the line of dusk climbing the tower) reads from it, so the grade is perfectly
//  reversible and always in sync with the camera.
// ─────────────────────────────────────────────────────────────────────────────

const c = (hex) => new Color(hex)

// Sand beige darkening through earthy brown to black. No orange, no sunset: the light
// simply withdraws, and the same warm sand hue stays in everything until nothing is left.
const SKY_HORIZON = [c('#eadcc0'), c('#9b8662'), c('#000000')]
const SKY_ZENITH = [c('#cdb48c'), c('#4a3d2e'), c('#000000')]
const SUN = [c('#fff0d4'), c('#f1dcb2'), c('#cdb58a')]
const HEMI_SKY = [c('#f6e9d2'), c('#bda98a'), c('#000000')]
const HEMI_GROUND = [c('#c9b289'), c('#5f4f3a'), c('#000000')]
const GROUND = [c('#d8c6a3'), c('#8f7c5d'), c('#000000')]

const tmpA = new Color()
function tri(set, dusk, night, out) {
  tmpA.copy(set[0]).lerp(set[1], dusk)
  out.copy(tmpA).lerp(set[2], night)
  return out
}

// The sun travels across the sky while the camera orbits (a time-lapse of one late
// afternoon). Start: sun behind the camera, 57° to one side → raking, form-revealing
// light. End: sun low, 51° off the line of sight → last light grazing the tower.
export const SUN_AZ_START = 0.38
export const SUN_AZ_END = 2.05
export const sunAzimuth = (u) => lerp(SUN_AZ_START, SUN_AZ_END, u)

export function createGrade() {
  return {
    dusk: 0,
    night: 0,
    skyHorizon: new Color(),
    skyZenith: new Color(),
    fog: new Color(),
    fogDensity: 0.0006,
    sunColor: new Color(),
    sunIntensity: 0,
    sunElevation: 0.5,
    hemiSky: new Color(),
    hemiGround: new Color(),
    hemiIntensity: 0,
    fillIntensity: 0,
    ground: new Color(),
    glow: 1,
    termY: -20, // height (m) below which the tower has fallen into shade
    duskMix: 0,
    dust: 1,
  }
}

export function gradeAt(u, g) {
  const dusk = smoothstep(0.44, 0.84, u)
  const night = smoothstep(0.72, 0.985, u)
  g.dusk = dusk
  g.night = night

  tri(SKY_HORIZON, dusk, night, g.skyHorizon)
  tri(SKY_ZENITH, dusk, night, g.skyZenith)
  g.fog.copy(g.skyHorizon).multiplyScalar(0.96)
  g.fogDensity = lerp(0.00054, 0.00092, dusk) + night * 0.0018

  tri(SUN, dusk, night, g.sunColor)
  const lightLeft = Math.pow(1 - night, 1.35)
  g.sunIntensity = lerp(3.5, 2.5, dusk) * lightLeft
  g.sunElevation = lerp(0.52, 0.17, smoothstep(0.22, 0.95, u)) // 30° → 10°

  tri(HEMI_SKY, dusk, night, g.hemiSky)
  tri(HEMI_GROUND, dusk, night, g.hemiGround)
  g.hemiIntensity = lerp(0.85, 0.42, dusk) * Math.pow(1 - night, 1.6)
  g.fillIntensity = lerp(0.32, 0.12, dusk) * lightLeft

  tri(GROUND, dusk, night, g.ground)
  g.glow = 1 - night

  // the line of last light climbs the tower: the base falls into shade first,
  // the upper pavilion keeps the sun the longest.
  g.duskMix = smoothstep(0.4, 0.54, u)
  g.termY = lerp(-16, 72, Math.pow(clamp((u - 0.52) / 0.465), 1.3))
  g.dust = 1 - smoothstep(0.55, 0.9, u)
  return g
}

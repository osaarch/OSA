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

// NIGHT MODE — moonlit, rainy darkness instead of the late afternoon. It fades to the same
// black at the end of the journey, so the menu still arrives on pure black.
const N_HORIZON = c('#1b2a45')
const N_ZENITH = c('#040812')
const N_MOON = c('#9db6e6')
const N_HEMI_SKY = c('#2a3c60')
const N_HEMI_GROUND = c('#10151f')
const N_GROUND = c('#2c3442')
const tmpN = new Color()

function nightBlend(u, g, nm) {
  const live = 1 - smoothstep(0.9, 0.995, u)
  const lerpCol = (a, b) => a.lerp(b, nm)
  lerpCol(g.skyHorizon, tmpN.copy(N_HORIZON).multiplyScalar(live))
  lerpCol(g.skyZenith, tmpN.copy(N_ZENITH).multiplyScalar(live))
  g.fog.copy(g.skyHorizon).multiplyScalar(0.92)
  g.fogDensity = lerp(g.fogDensity, 0.0011, nm)
  lerpCol(g.sunColor, N_MOON)
  g.sunIntensity = lerp(g.sunIntensity, 2.1 * live, nm)
  g.sunElevation = lerp(g.sunElevation, 0.7, nm)
  lerpCol(g.hemiSky, N_HEMI_SKY)
  lerpCol(g.hemiGround, N_HEMI_GROUND)
  g.hemiIntensity = lerp(g.hemiIntensity, 1.05 * live, nm)
  g.fillIntensity = lerp(g.fillIntensity, 0.05 * live, nm)
  lerpCol(g.ground, tmpN.copy(N_GROUND).multiplyScalar(live))
  g.glow = lerp(g.glow, 0.55 * live, nm)
  g.duskMix = lerp(g.duskMix, 0, nm)
  g.dust = lerp(g.dust, 0.35 * live, nm)
  g.night = lerp(g.night, 1, nm)
  g.dusk = lerp(g.dusk, 1, nm)
}

// DARK THEME — the mysterious one: the monument, the dunes and the sky go black under a smoky, moonless
// mist; a low cold light from behind only rims the edges of the tower. No fire, no ember.
const D_HORIZON = c('#474a53')
const D_ZENITH = c('#08090b')
const D_LIGHT = c('#b4bfd2')
const D_HEMI_SKY = c('#292d35')
const D_HEMI_GROUND = c('#060607')
const D_GROUND = c('#0b0b0d')
const tmpD = new Color()

function darkBlend(u, g, dm) {
  const live = 1 - smoothstep(0.9, 0.995, u)
  g.skyHorizon.lerp(tmpD.copy(D_HORIZON).multiplyScalar(live), dm)
  g.skyZenith.lerp(tmpD.copy(D_ZENITH).multiplyScalar(live), dm)
  g.fog.lerp(tmpD.copy(D_HORIZON).multiplyScalar(0.9 * live), dm)
  g.fogDensity = lerp(g.fogDensity, 0.00078, dm)
  g.sunColor.lerp(D_LIGHT, dm)
  g.sunIntensity = lerp(g.sunIntensity, 2.8 * live, dm)
  g.sunElevation = lerp(g.sunElevation, 0.17, dm)
  g.hemiSky.lerp(D_HEMI_SKY, dm)
  g.hemiGround.lerp(D_HEMI_GROUND, dm)
  g.hemiIntensity = lerp(g.hemiIntensity, 0.55 * live, dm)
  g.fillIntensity = lerp(g.fillIntensity, 0.04 * live, dm)
  g.ground.lerp(tmpD.copy(D_GROUND).multiplyScalar(live), dm)
  g.glow = lerp(g.glow, 0.55 * live, dm)
  g.duskMix = lerp(g.duskMix, 0, dm)
  g.dust = lerp(g.dust, 0.35 * live, dm)
  g.dark = dm
}

export function createGrade() {
  return {
    dark: 0,
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

export function gradeAt(u, g, nm = 0, dm = 0) {
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
  if (nm > 0.001) nightBlend(u, g, nm)
  g.dark = 0
  if (dm > 0.001) darkBlend(u, g, dm)
  return g
}

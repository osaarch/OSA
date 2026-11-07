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

// NIGHT MODE — the stadium under a rainy night sky from the first frame: a moon, a black-blue
// horizon, the bowl glowing red from within and the glazing lit sky-blue. It fades to black at
// the end like the day grade does.
const N_HORIZON = c('#16233b')
const N_ZENITH = c('#03060e')
const N_MOON = c('#9db6e6')
const N_HEMI_SKY = c('#26365a')
const N_HEMI_GR = c('#120d12')
const tmpN = new Color()

function nightBlend(u, g, nm) {
  const live = 1 - g.black
  g.skyHorizon.lerp(tmpN.copy(N_HORIZON).multiplyScalar(live), nm)
  g.skyZenith.lerp(tmpN.copy(N_ZENITH).multiplyScalar(live), nm)
  g.fog.copy(g.skyHorizon).multiplyScalar(0.92)
  g.fogDensity = lerp(g.fogDensity, 0.00105, nm)
  g.sunColor.lerp(N_MOON, nm)
  g.sunIntensity = lerp(g.sunIntensity, 0.75 * live, nm)
  g.sunElevation = lerp(g.sunElevation, 0.62, nm)
  g.hemiSky.lerp(N_HEMI_SKY, nm)
  g.hemiGround.lerp(N_HEMI_GR, nm)
  g.hemiIntensity = lerp(g.hemiIntensity, 0.5 * live, nm)
  g.fillIntensity = lerp(g.fillIntensity, 0.05 * live, nm)
  g.glow = lerp(g.glow, 0.5 * live, nm)
  g.dust = lerp(g.dust, 0.3 * live, nm)
  g.redLight = lerp(g.redLight, 0.92 * live, nm)
  g.night = lerp(g.night, 1, nm)
  g.dusk = lerp(g.dusk, 1, nm)
}

// DARK THEME — two colours only: black, and a warm earth-toned light (lit adobe, not gold). The sky, the
// ground, the river, the roofs and the palms are black; only the glazing of the stadium is lit, in that one
// colour, with a thin amber edge on the black forms around it. It fades to black at the end like the others.
const D_HORIZON = c('#050302')
const D_ZENITH = c('#000000')
const D_LIGHT = c('#d29c66')
const D_HEMI_SKY = c('#1a0f08')
const D_HEMI_GR = c('#050302')
const tmpD = new Color()

function darkBlend(u, g, dm) {
  const live = 1 - g.black
  g.skyHorizon.lerp(tmpD.copy(D_HORIZON).multiplyScalar(live), dm)
  g.skyZenith.lerp(tmpD.copy(D_ZENITH).multiplyScalar(live), dm)
  g.fog.copy(g.skyHorizon).multiplyScalar(0.8)
  g.fogDensity = lerp(g.fogDensity, 0.0008, dm)
  g.sunColor.lerp(D_LIGHT, dm)
  g.sunIntensity = lerp(g.sunIntensity, 0, dm) // no moon, no sun: the glass is the only light
  g.sunElevation = lerp(g.sunElevation, 0.3, dm)
  g.hemiSky.lerp(D_HEMI_SKY, dm)
  g.hemiGround.lerp(D_HEMI_GR, dm)
  g.hemiIntensity = lerp(g.hemiIntensity, 0.12 * live, dm)
  g.fillIntensity = lerp(g.fillIntensity, 0, dm)
  g.glow = lerp(g.glow, 0, dm)
  g.dust = lerp(g.dust, 0.35 * live, dm)
  g.redLight = lerp(g.redLight, 1.0 * live, dm) // drives how much the glazing is lit
  g.crowd = lerp(g.crowd, 0, dm)
  g.night = lerp(g.night, 1, dm)
  g.dusk = lerp(g.dusk, 1, dm)
  g.dark = dm
}

export function createGrade() {
  return {
    dark: 0,
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

export function gradeAt(u, g, nm = 0, dm = 0) {
  const dusk = smoothstep(0.3, 0.66, u)
  const night = smoothstep(0.58, 0.88, u)
  const black = smoothstep(0.955, 1.0, u)
  const live = 1 - black
  g.dusk = dusk
  g.night = night
  g.black = black

  tri(SKY_H, dusk, night, g.skyHorizon).multiplyScalar(live)
  tri(SKY_Z, dusk, night, g.skyZenith).multiplyScalar(live)
  g.fog.copy(g.skyHorizon).multiplyScalar(0.99)
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
  g.crowd = smoothstep(0.62, 0.86, u) * live
  if (nm > 0.001) nightBlend(u, g, nm)
  g.dark = 0
  if (dm > 0.001) darkBlend(u, g, dm)
  // the camera draws back over the site at the end: the haze thins so the whole of it can be read from above
  g.fogDensity *= 1 - 0.82 * smoothstep(0.78, 0.94, u)
  return g
}

// the sun keeps a constant angle to the camera: raking light from the side, always
export const sunAzimuth = (theta, u) => theta + lerp(1.05, 0.7, u)

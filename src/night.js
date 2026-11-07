import { useSyncExternalStore } from 'react'
import { audio } from './audio'

// ─────────────────────────────────────────────────────────────────────────────
//  THEMES     one switch, three ways to see the Malwiya and the stadium:
//    day    the usual look — earth and sand, the late-afternoon light
//    night  the natural night: a moonlit, rainy darkness (the stadium glows red from within); rain also
//           falls in the soundtrack
//    dark   two colours only — black, and a warm earth-toned light: the Malwiya alone is lit, and only the
//           stadium's glazing glows (no rain, no moon)
//  `night.v` and `dark.v` are the eased 0 → 1 mixes the scenes read every frame; `night.on` /
//  `dark.on` are the choice. Only one of them is ever on.
// ─────────────────────────────────────────────────────────────────────────────
export const THEMES = ['day', 'night', 'dark']
const KEY = 'osa-theme'
const LEGACY = 'osa-night' // the old Day / Night switch

const fromUrl = () => {
  try {
    const t = new URLSearchParams(window.location.search).get('theme')
    return THEMES.includes(t) ? t : null
  } catch (e) {
    return null
  }
}
const read = () => {
  const u = fromUrl()
  if (u) return u
  try {
    const t = localStorage.getItem(KEY)
    if (THEMES.includes(t)) return t
    return localStorage.getItem(LEGACY) === 'on' ? 'night' : 'day'
  } catch (e) {
    return 'day'
  }
}

const initial = read()
export const night = { on: initial === 'night', v: initial === 'night' ? 1 : 0, t: 0 }
export const dark = { on: initial === 'dark', v: initial === 'dark' ? 1 : 0 }

const listeners = new Set()
let snap = initial

// The scenes that stop rendering when nothing moves (the black end screen) register here
// so a switch wakes them up.
const wakers = new Set()
export const onNightWake = (fn) => {
  wakers.add(fn)
  return () => wakers.delete(fn)
}

// Where it rains. The rain belongs to the cinematic journeys (the Malwiya and the stadium) and nowhere
// else: the journey's frame loop sets the zone to "1 − black" (so the rain thins out and stops as the
// screen goes black), and every page change starts dry. `rainZone.v` is the eased value the canvas reads.
export const rainZone = { target: 0, v: 0 }
const zoneListeners = new Set()
export const onRainZone = (fn) => {
  zoneListeners.add(fn)
  return () => zoneListeners.delete(fn)
}
export function setRainZone(z) {
  z = z < 0 ? 0 : z > 1 ? 1 : z
  if (z === rainZone.target) return
  rainZone.target = z
  audio.setRain(night.on ? z : 0)
  zoneListeners.forEach((fn) => fn())
}

audio.setRain(0)
const mark = (name) => {
  if (typeof document === 'undefined') return
  const c = document.documentElement.classList
  c.toggle('is-night', name === 'night')
  c.toggle('is-dark', name === 'dark')
}
mark(initial)

export function setTheme(name) {
  if (!THEMES.includes(name)) return
  night.on = name === 'night'
  dark.on = name === 'dark'
  snap = name
  try {
    localStorage.setItem(KEY, name)
  } catch (e) {
    /* storage may be unavailable */
  }
  audio.setRain(night.on ? rainZone.target : 0)
  mark(name)
  wakers.forEach((fn) => fn())
  listeners.forEach((l) => l())
}

export const cycleTheme = () => setTheme(THEMES[(THEMES.indexOf(snap) + 1) % THEMES.length])
export const currentTheme = () => snap

// is a theme still easing in or out? (the frame loops keep drawing while it is)
export const themeBusy = () => night.v !== (night.on ? 1 : 0) || dark.v !== (dark.on ? 1 : 0)

// Called by every frame loop; time-based so several callers in one frame step it only once.
// Returns the night mix; the dark mix is read from `dark.v` afterwards.
export function stepNight() {
  const now = performance.now()
  const dt = Math.min(0.1, Math.max(0, (now - (night.t || now)) / 1000))
  night.t = now
  const target = night.on ? 1 : 0
  if (night.v !== target) {
    night.v += (target - night.v) * (1 - Math.exp(-dt * 1.7))
    if (Math.abs(target - night.v) < 0.002) night.v = target
  }
  const dtarget = dark.on ? 1 : 0
  if (dark.v !== dtarget) {
    dark.v += (dtarget - dark.v) * (1 - Math.exp(-dt * 1.7))
    if (Math.abs(dtarget - dark.v) < 0.002) dark.v = dtarget
  }
  const dz = rainZone.target - rainZone.v
  if (dz) {
    rainZone.v += dz * (1 - Math.exp(-dt * 2.4))
    if (Math.abs(rainZone.target - rainZone.v) < 0.002) rainZone.v = rainZone.target
  }
  return night.v
}

const subscribe = (l) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
// the name of the theme ('day' | 'dark' | 'night')
export function useTheme() {
  return useSyncExternalStore(subscribe, () => snap)
}
// true while the rainy night is the chosen theme
export function useNight() {
  return useSyncExternalStore(subscribe, () => snap === 'night')
}

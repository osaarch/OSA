import { useSyncExternalStore } from 'react'
import { audio } from './audio'

// ─────────────────────────────────────────────────────────────────────────────
//  NIGHT MODE     one switch: the Malwiya and the stadium are seen at night —
//  moonlit darkness, rain on the screen and rain in the soundtrack.
//  `night.v` is the eased 0 → 1 mix the scenes read every frame; `night.on` is the choice.
// ─────────────────────────────────────────────────────────────────────────────
const KEY = 'osa-night'
const read = () => {
  try {
    return localStorage.getItem(KEY) === 'on'
  } catch (e) {
    return false
  }
}

const initial = read()
export const night = { on: initial, v: initial ? 1 : 0, t: 0 }

const listeners = new Set()
let snap = initial

// The scenes that stop rendering when nothing moves (the black end screen) register here
// so a switch wakes them up.
const wakers = new Set()
export const onNightWake = (fn) => {
  wakers.add(fn)
  return () => wakers.delete(fn)
}

audio.setRain(initial ? 1 : 0)
if (typeof document !== 'undefined') document.documentElement.classList.toggle('is-night', initial)

export function setNight(on) {
  night.on = on
  snap = on
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch (e) {
    /* storage may be unavailable */
  }
  audio.setRain(on ? 1 : 0)
  document.documentElement.classList.toggle('is-night', on)
  wakers.forEach((fn) => fn())
  listeners.forEach((l) => l())
}

export const toggleNight = () => setNight(!night.on)

// Called by every frame loop; time-based so several callers in one frame step it only once.
export function stepNight() {
  const now = performance.now()
  const dt = Math.min(0.1, Math.max(0, (now - (night.t || now)) / 1000))
  night.t = now
  const target = night.on ? 1 : 0
  if (night.v !== target) {
    night.v += (target - night.v) * (1 - Math.exp(-dt * 1.7))
    if (Math.abs(target - night.v) < 0.002) night.v = target
  }
  return night.v
}

export function useNight() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => snap,
  )
}

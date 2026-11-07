import { useSyncExternalStore } from 'react'

// Uniforms shared by every material on the monument. They are driven by the colour
// script (grade.js) so the "last light" line can climb the tower as night falls.
export const duskUniforms = {
  uDuskMix: { value: 0 },
  uTermY: { value: -20 },
  uTermSoft: { value: 9 },
  uDark: { value: 0 }, // 1 = the dark theme (everything black)
}

// Tiny observable for model-loading progress (drives the loading overlay).
const state = { progress: 0, ready: false, error: null }
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())

export const loadState = {
  get: () => state,
  set(patch) {
    Object.assign(state, patch)
    state.snapshot = { ...state }
    emit()
  },
  subscribe(l) {
    listeners.add(l)
    return () => listeners.delete(l)
  },
}
state.snapshot = { ...state }

export function useLoadState() {
  return useSyncExternalStore(loadState.subscribe, () => state.snapshot)
}

// Mutable registry used by the render loop (not React state).
export const INTRO_LEN = 7.2 // seconds of the sandstorm teaser

export const world = {
  paused: false,
  introStarted: false, // the visitor has chosen "enter" (with / without sound)
  introDone: false,
  introT: 0,
  introSkip: false,
  introFreeze: false, // tests only
  forceFrames: 4,
  camDist: 0,
  camAlt: 0,
  azimuthDeg: 0,
}

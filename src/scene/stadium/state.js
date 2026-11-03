import { useSyncExternalStore } from 'react'

// Shared, mutable state for the stadium journey (kept outside React: it is written every
// frame by the render loop and read by the camera, the lights and the DOM overlays).
export const SJ_VH = 720 // scroll length of the stadium journey, in viewport heights

export const sj = { target: 0, current: 0, velocity: 0 }

export const stadiumWorld = {
  active: false, // the project page is open and wants frames
  forceFrames: 4,
}

// Tiny observable for the stadium's loading state.
const state = { progress: 0, ready: false, error: null, snapshot: null }
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())
state.snapshot = { ...state }
export const stadiumLoad = {
  get: () => state,
  set(patch) {
    Object.assign(state, patch)
    state.snapshot = { progress: state.progress, ready: state.ready, error: state.error }
    emit()
  },
  subscribe(l) {
    listeners.add(l)
    return () => listeners.delete(l)
  },
}
export function useStadiumLoad() {
  return useSyncExternalStore(stadiumLoad.subscribe, () => state.snapshot)
}

// The chapters of the journey, named after the project's own image captions.
export const CHAPTERS = [
  { from: 0, to: 0.27, n: '01', title: 'A Landscape of Fragments' },
  { from: 0.27, to: 0.58, n: '02', title: 'River and Architecture' },
  { from: 0.58, to: 0.8, n: '03', title: 'Emerging from the Ground' },
  { from: 0.8, to: 1.01, n: '04', title: 'Inside the Bowl' },
]

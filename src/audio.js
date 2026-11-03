import { useSyncExternalStore } from 'react'

// ═════════════════════════════════════════════════════════════════════════════
//  GENERATIVE SOUNDTRACK  — synthesised live with the Web Audio API (no audio files)
//
//  Mood:   a slow, spacious piece in maqam BAYATI on D — the most familiar maqam of
//          Iraqi music. Its signature is the quarter-flat second degree (E half-flat),
//          which gives a gentle Arabic colour without turning into a cliché.
//  Voices: · a low drone (D + A)                       the ground
//          · oud-like plucked phrases, free rhythm     the voice
//          · a ney-like breathy flute, rare long notes the horizon
//          · a soft pad that breathes between chords   the air
//          · WIND + falling-sand grains                the dust — this is the layer that
//            disappears when you arrive at OSA / WORKS, leaving only the music.
// ═════════════════════════════════════════════════════════════════════════════

const TONIC = 146.83 // D3
// maqam Bayati on D, in cents above the tonic:  D  E½♭  F  G  A  B♭  C
const CENTS = [0, 150, 300, 500, 700, 800, 1000]
const note = (i) => TONIC * Math.pow(2, (CENTS[((i % 7) + 7) % 7] + 1200 * Math.floor(i / 7)) / 1200)

const rnd = (a, b) => a + Math.random() * (b - a)
const pick = (arr) => arr[(Math.random() * arr.length) | 0]
const clamp = (x, a, b) => Math.min(b, Math.max(a, x))

export function createEngine(ctx) {
  const sr = ctx.sampleRate
  const mk = {
    gain: (v = 1) => {
      const g = ctx.createGain()
      g.gain.value = v
      return g
    },
    filter: (type, f, q = 0.7) => {
      const b = ctx.createBiquadFilter()
      b.type = type
      b.frequency.value = f
      b.Q.value = q
      return b
    },
    osc: (type, f) => {
      const o = ctx.createOscillator()
      o.type = type
      o.frequency.value = f
      return o
    },
  }

  // shared noise (wind, breath, grains, pick noise)
  const noiseBuf = ctx.createBuffer(1, sr * 4, sr)
  {
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  const noise = (loop = false, offset = 0) => {
    const s = ctx.createBufferSource()
    s.buffer = noiseBuf
    s.loop = loop
    return [s, offset]
  }

  // procedural hall reverb (decaying, darkened noise)
  const ir = ctx.createBuffer(2, Math.floor(sr * 4.2), sr)
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c)
    let lp = 0
    for (let i = 0; i < d.length; i++) {
      lp += (Math.random() * 2 - 1 - lp) * 0.28
      d[i] = lp * Math.pow(1 - i / d.length, 2.7)
    }
  }

  // ── graph ────────────────────────────────────────────────────────────────
  const musicBus = mk.gain(0)
  const windMaster = mk.gain(0)
  const mix = mk.gain(1)
  const reverb = ctx.createConvolver()
  reverb.buffer = ir
  const reverbSend = mk.gain(0.55)
  const reverbWet = mk.gain(0.85)
  const lpf = mk.filter('lowpass', 9000, 0.4)
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -20
  comp.knee.value = 18
  comp.ratio.value = 3
  comp.attack.value = 0.02
  comp.release.value = 0.4
  const master = mk.gain(0)

  musicBus.connect(mix)
  musicBus.connect(reverbSend)
  reverbSend.connect(reverb)
  reverb.connect(reverbWet)
  reverbWet.connect(mix)
  windMaster.connect(mix)
  windMaster.connect(reverbSend)
  mix.connect(lpf)
  lpf.connect(comp)
  comp.connect(master)
  master.connect(ctx.destination)

  // ── drone: D + A, slowly breathing ────────────────────────────────────────
  {
    const dronePre = mk.gain(0.058)
    const droneLp = mk.filter('lowpass', 480, 0.6)
    dronePre.connect(droneLp)
    droneLp.connect(musicBus)
    const breathe = mk.osc('sine', 0.045)
    const breatheG = mk.gain(0.025)
    breathe.connect(breatheG)
    breatheG.connect(dronePre.gain)
    breathe.start()
    for (const [f, g] of [
      [TONIC / 2, 1],
      [note(4) / 2, 0.55],
      [TONIC, 0.3],
    ]) {
      for (const [type, det, gv] of [
        ['sawtooth', -5, 0.35],
        ['triangle', 4, 0.8],
      ]) {
        const o = mk.osc(type, f)
        o.detune.value = det
        const og = mk.gain(g * gv)
        o.connect(og)
        og.connect(dronePre)
        o.start()
      }
    }
  }

  // ── wind: two noise bands with slow gusts ─────────────────────────────────
  {
    const [src] = noise(true)
    const bp = mk.filter('bandpass', 540, 0.7)
    const gust = mk.gain(0.55)
    const l1 = mk.osc('sine', 0.071)
    const l1g = mk.gain(0.3)
    const l2 = mk.osc('sine', 0.173)
    const l2g = mk.gain(0.14)
    l1.connect(l1g)
    l1g.connect(gust.gain)
    l2.connect(l2g)
    l2g.connect(gust.gain)
    src.connect(bp)
    bp.connect(gust)
    gust.connect(windMaster)
    src.start(0, 0)
    l1.start()
    l2.start()

    const [hiss] = noise(true)
    const hp = mk.filter('highpass', 2600, 0.5)
    const bp2 = mk.filter('bandpass', 5200, 0.9)
    const hg = mk.gain(0.2)
    const l3 = mk.osc('sine', 0.113)
    const l3g = mk.gain(0.12)
    l3.connect(l3g)
    l3g.connect(hg.gain)
    hiss.connect(hp)
    hp.connect(bp2)
    bp2.connect(hg)
    hg.connect(windMaster)
    hiss.start(0, 1.7)
    l3.start()
  }

  // ── voices ───────────────────────────────────────────────────────────────
  const log = []
  function oud(t, f, vel = 0.7, dur = 2) {
    log.push([t, f, vel])
    const g = mk.gain(0)
    const lp = mk.filter('lowpass', 900 + 3600 * vel, 1.1)
    lp.frequency.setValueAtTime(900 + 3600 * vel, t)
    lp.frequency.exponentialRampToValueAtTime(380, t + 0.6)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.27 * vel, t + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    for (const [type, det, mul, gv] of [
      ['sawtooth', -4, 1, 0.55],
      ['sawtooth', 5, 1, 0.45],
      ['triangle', 0, 2, 0.2],
    ]) {
      const o = mk.osc(type, f * mul * 1.012)
      o.frequency.setValueAtTime(f * mul * 1.012, t)
      o.frequency.exponentialRampToValueAtTime(f * mul, t + 0.05)
      o.detune.value = det
      const og = mk.gain(gv)
      o.connect(og)
      og.connect(lp)
      o.start(t)
      o.stop(t + dur + 0.1)
    }
    lp.connect(g)
    g.connect(musicBus)
    // pick noise
    const [s] = noise()
    const cb = mk.filter('bandpass', 2300, 1.2)
    const cg = mk.gain(0)
    cg.gain.setValueAtTime(0.0001, t)
    cg.gain.linearRampToValueAtTime(0.06 * vel, t + 0.002)
    cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.03)
    s.connect(cb)
    cb.connect(cg)
    cg.connect(musicBus)
    s.start(t, rnd(0, 3))
    s.stop(t + 0.05)
  }

  function ney(t, f, dur, vel = 0.6) {
    const g = mk.gain(0)
    const lp = mk.filter('lowpass', 4600, 0.5)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.13 * vel, t + 0.4)
    g.gain.setValueAtTime(0.13 * vel, t + dur)
    g.gain.setTargetAtTime(0.0001, t + dur, 0.5)
    const vib = mk.osc('sine', 5.3)
    const vg = mk.gain(0)
    vg.gain.setValueAtTime(0, t)
    vg.gain.linearRampToValueAtTime(13, t + dur * 0.55)
    vib.connect(vg)
    for (const [type, mul, gv] of [
      ['sine', 1, 1],
      ['triangle', 2, 0.1],
    ]) {
      const o = mk.osc(type, f * mul)
      o.frequency.setValueAtTime(f * mul * 0.98, t)
      o.frequency.setTargetAtTime(f * mul, t, 0.09)
      vg.connect(o.detune)
      const og = mk.gain(gv)
      o.connect(og)
      og.connect(lp)
      o.start(t)
      o.stop(t + dur + 2.5)
    }
    // breath
    const [s] = noise(true)
    const bp = mk.filter('bandpass', f * 2.3, 2.4)
    const bg = mk.gain(0)
    bg.gain.setValueAtTime(0.0001, t)
    bg.gain.linearRampToValueAtTime(0.07 * vel, t + 0.25)
    bg.gain.setValueAtTime(0.05 * vel, t + dur)
    bg.gain.setTargetAtTime(0.0001, t + dur, 0.4)
    s.connect(bp)
    bp.connect(bg)
    bg.connect(lp)
    s.start(t, rnd(0, 2))
    s.stop(t + dur + 2.5)
    vib.start(t)
    vib.stop(t + dur + 2.5)
    lp.connect(g)
    g.connect(musicBus)
  }

  function pad(t, idxs, dur) {
    const lp = mk.filter('lowpass', 1000, 0.5)
    const g = mk.gain(0)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.026, t + 6)
    g.gain.setValueAtTime(0.026, t + dur - 8)
    g.gain.linearRampToValueAtTime(0.0001, t + dur)
    lp.connect(g)
    g.connect(musicBus)
    for (const i of idxs) {
      for (const [type, det] of [
        ['triangle', -6],
        ['sine', 5],
      ]) {
        const o = mk.osc(type, note(i))
        o.detune.value = det
        const og = mk.gain(0.5)
        o.connect(og)
        og.connect(lp)
        o.start(t)
        o.stop(t + dur + 0.2)
      }
    }
  }

  // falling-sand grain: a tiny, bright tick
  function grain(t) {
    const [s] = noise()
    const f = mk.filter('bandpass', rnd(4200, 9500), 1.4)
    const g = mk.gain(0)
    const d = rnd(0.003, 0.012)
    const v = rnd(0.015, 0.06)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(v, t + 0.001)
    g.gain.exponentialRampToValueAtTime(0.0001, t + d)
    s.connect(f)
    f.connect(g)
    g.connect(windMaster)
    s.start(t, rnd(0, 3))
    s.stop(t + d + 0.02)
  }

  // ── the "composer": a free-rhythm generative scheduler ────────────────────
  const state = {
    idx: 4,
    nextPhrase: 1.2,
    nextNey: 7,
    nextPad: 0.2,
    nextGrain: 0.2,
    padN: 0,
    level: { wind: 0, music: 0.4, clarity: 1 },
  }
  const CHORDS = [
    [0, 4, 9],
    [0, 3, 4],
    [-2, 2, 7],
    [0, 4, 8],
  ]

  // Characteristic Bayati gestures (scale-degree indices): the quarter-flat second (1) is
  // the heart of the maqam, and the falling A–G–F–E½♭–D line is its signature descent.
  const MOTIFS = [
    [4, 3, 2, 1, 0],
    [0, 1, 2, 1, 0],
    [1, 2, 3, 2, 1, 0],
    [2, 1, 0, 1, 0],
    [3, 2, 1, 2, 1, 0],
    [0, 1, 0, 1, 2],
  ]

  function phrase(t0) {
    let t = t0
    let i = state.idx
    const seq = []
    // sometimes lift the gesture into the upper register (G–A–B♭–C–D is Bayati's upper jins)
    const root = pick([0, 0, 0, 3, 4, 4, 7])
    if (Math.random() < 0.65) seq.push(...pick(MOTIFS).map((d) => d + root))
    const extra = 1 + ((Math.random() * 3) | 0)
    for (let k = 0; k < extra; k++) {
      const from = seq.length ? seq[seq.length - 1] : i
      const steps = from < 4 ? [0, 1, 1, 2, 2, 3] : from > 9 ? [-3, -2, -2, -1, -1, 0] : [-2, -1, -1, 0, 1, 1, 2]
      i = clamp(from + pick(steps), 0, 12)
      seq.push(i)
    }
    seq.push(pick([0, 0, 0, 4, 3, 1, 7])) // resolve on D, or pause on A / G / the quarter-flat E
    for (let k = 0; k < seq.length; k++) {
      const n = seq[k]
      const last = k === seq.length - 1
      if (!last && Math.random() < 0.2) {
        oud(t, note(n + 1), 0.35, 0.5) // grace note
        t += 0.09
      }
      oud(t, note(n), last ? 0.85 : rnd(0.55, 0.9), last ? 3.4 : 1.9)
      t += last ? rnd(1.8, 2.6) : pick([0.38, 0.5, 0.5, 0.75, 1.0, 1.35])
      state.idx = n
    }
    return t
  }

  function scheduleUntil(horizon) {
    while (state.nextPad < horizon) {
      const dur = 26
      pad(state.nextPad, CHORDS[state.padN++ % CHORDS.length], dur)
      state.nextPad += dur - 6
    }
    while (state.nextPhrase < horizon) {
      const end = phrase(state.nextPhrase)
      const restScale = 1 + (1 - state.level.music) * 1.1
      state.nextPhrase = end + rnd(2.6, 6) * restScale
    }
    while (state.nextNey < horizon) {
      const dur = rnd(5, 9)
      ney(state.nextNey, note(pick([11, 14, 10, 9, 12, 14])), dur, rnd(0.5, 0.75))
      state.nextNey += dur + rnd(9, 15) * (1 + (1 - state.level.music))
    }
    const rate = 3 + 55 * state.level.wind
    while (state.nextGrain < horizon) {
      if (state.level.wind > 0.02) grain(state.nextGrain)
      state.nextGrain += -Math.log(1 - Math.random()) / rate
    }
  }

  // ── controls ─────────────────────────────────────────────────────────────
  function setScene({ wind, music, clarity }, immediate = false) {
    const t = ctx.currentTime
    if (wind != null) state.level.wind = wind
    if (music != null) state.level.music = music
    if (clarity != null) state.level.clarity = clarity
    const set = (param, v, tc) => (immediate ? (param.value = v) : param.setTargetAtTime(v, t, tc))
    set(windMaster.gain, 0.6 * state.level.wind, 0.5)
    set(musicBus.gain, 0.95 * state.level.music, 0.8)
    set(lpf.frequency, 900 + 8100 * Math.pow(state.level.clarity, 1.5), 0.6)
  }
  function setEnabled(on, immediate = false) {
    const t = ctx.currentTime
    if (immediate) master.gain.value = on ? 0.55 : 0
    else master.gain.setTargetAtTime(on ? 0.55 : 0, t, on ? 0.6 : 0.15)
  }
  function resumeClock() {
    const t = ctx.currentTime + 0.1
    state.nextPhrase = Math.max(state.nextPhrase, t + 0.6)
    state.nextNey = Math.max(state.nextNey, t + 5)
    state.nextPad = Math.max(state.nextPad, t)
    state.nextGrain = Math.max(state.nextGrain, t)
  }

  return { scheduleUntil, setScene, setEnabled, resumeClock, state, log }
}

// ═════════════════════════════════════════════════════════════════════════════
//  Real-time wrapper + UI state
// ═════════════════════════════════════════════════════════════════════════════
let ctx = null
let engine = null
let timer = 0
let snapshot = { on: false, ready: false }
let pendingScene = { wind: 0, music: 0.4, clarity: 1 }
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())
const set = (patch) => {
  snapshot = { ...snapshot, ...patch }
  emit()
}
const KEY = 'osa-sound'
const store = {
  get() {
    try {
      return localStorage.getItem(KEY)
    } catch (e) {
      return null
    }
  },
  put(v) {
    try {
      localStorage.setItem(KEY, v)
    } catch (e) {
      /* storage may be unavailable (private mode, sandboxed frame) */
    }
  },
}

function ensure() {
  if (ctx) return true
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)
  if (!AC) return false
  ctx = new AC()
  engine = createEngine(ctx)
  engine.setScene(pendingScene, true)
  return true
}
function pump() {
  engine.scheduleUntil(ctx.currentTime + 2.2)
}

export const audio = {
  // Must be called from a user gesture (click / key) — browsers refuse audio before.
  async enable() {
    if (!ensure()) return false
    try {
      await ctx.resume()
    } catch (e) {
      return false
    }
    engine.resumeClock()
    engine.setEnabled(true)
    clearInterval(timer)
    pump()
    timer = setInterval(pump, 250)
    store.put('on')
    set({ on: true, ready: true })
    return true
  },
  disable() {
    store.put('off')
    set({ on: false })
    if (!ctx) return
    engine.setEnabled(false)
    clearInterval(timer)
    const c = ctx
    setTimeout(() => {
      if (!snapshot.on && c.state === 'running') c.suspend().catch(() => {})
    }, 900)
  },
  toggle() {
    return snapshot.on ? this.disable() : this.enable()
  },
  // The soundtrack follows the scene: wind/sand while there is dust, only music after.
  setScene(p) {
    pendingScene = { ...pendingScene, ...p }
    if (engine) engine.setScene(pendingScene)
  },
  // A returning visitor who chose "sound" last time: start on their first click or key.
  armFromPreference() {
    if (store.get() !== 'on' || snapshot.on) return
    const go = () => {
      window.removeEventListener('pointerdown', go, true)
      window.removeEventListener('keydown', go, true)
      if (!snapshot.on && store.get() === 'on') this.enable()
    }
    window.addEventListener('pointerdown', go, true)
    window.addEventListener('keydown', go, true)
  },
  preferred: () => store.get(),
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!ctx || !snapshot.on) return
    if (document.hidden) ctx.suspend().catch(() => {})
    else ctx.resume().catch(() => {})
  })
}

export function useAudio() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => snapshot,
  )
}

// Offline render, used only for verification (?debug).
export async function renderOffline(seconds = 30, scene = { wind: 0, music: 1, clarity: 1 }) {
  const oc = new OfflineAudioContext(2, 44100 * seconds, 44100)
  const e = createEngine(oc)
  e.setScene(scene, true)
  e.setEnabled(true, true)
  e.scheduleUntil(seconds)
  const buffer = await oc.startRendering()
  return { buffer, log: e.log }
}

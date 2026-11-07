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

// Three moods share one engine. "malwiya" is the Bayati piece above; "stadium" is a different
// piece altogether — a modern one: a maqsum groove (soft kick, darbuka, hand-claps, shaker), a
// sub-bass and an airy pad pumping to the kick, a plucked qanun-like arpeggio and a reedy lead that
// slides between the notes of maqam RAST on C (its neutral third — E half-flat — is the Arabic
// colour), calm and driving at once. "port" is the quiet harbour piece for the other projects.
const MOODS = {
  malwiya: {
    tonic: 146.83, // D3
    // maqam Bayati on D, in cents above the tonic:  D  E½♭  F  G  A  B♭  C
    cents: [0, 150, 300, 500, 700, 800, 1000],
    chords: [
      [0, 4, 9],
      [0, 3, 4],
      [-2, 2, 7],
      [0, 4, 8],
    ],
    // the quarter-flat second (1) is the heart of the maqam; A–G–F–E½♭–D is its signature descent
    motifs: [
      [4, 3, 2, 1, 0],
      [0, 1, 2, 1, 0],
      [1, 2, 3, 2, 1, 0],
      [2, 1, 0, 1, 0],
      [3, 2, 1, 2, 1, 0],
      [0, 1, 0, 1, 2],
    ],
    roots: [0, 0, 0, 3, 4, 4, 7],
    resolves: [0, 0, 0, 4, 3, 1, 7],
    ney: [11, 14, 10, 9, 12, 14],
    startIdx: 4,
    gap: [2.6, 6],
  },
  stadium: {
    tonic: 130.81, // C3
    // maqam Rast on C:  C  D  E½♭  F  G  A  B½♭
    cents: [0, 200, 350, 500, 700, 900, 1050],
    chords: [
      [0, 4, 9],
      [0, 3, 5],
      [-3, 2, 7],
      [0, 4, 7],
    ],
    // rising and falling Rast gestures: the open fifth (C–G) and the neutral third (E½♭)
    motifs: [
      [0, 1, 2, 3, 4],
      [4, 3, 2, 1, 0],
      [2, 3, 4, 3, 2, 1, 0],
      [0, 2, 1, 0],
      [4, 5, 4, 3, 2, 1, 0],
      [0, 1, 2, 1, 2, 0],
    ],
    roots: [0, 0, 0, 2, 4, 4, 7],
    resolves: [0, 0, 0, 4, 4, 2, 7],
    ney: [11, 14, 9, 11, 12, 14],
    startIdx: 2,
    gap: [3.4, 7.5],
    // the stadium: a modern groove at 104 bpm — see grooveModern() — over the sand and a crowd
    // that breathes and chants; brass-like fanfares on the Rast scale at the peak
    sport: { bpm: 104 },
    modern: {
      // the chord roots of the four-bar loop, as degrees of Rast:  C  –  A  –  F  –  G
      bars: [0, 5, 3, 4],
      // arpeggio shapes (scale steps above the chord root, in the octave above the tonic)
      arps: [
        [0, 2, 4, 7, 4, 2],
        [7, 4, 2, 4, 7, 9],
      ],
      // rhythms for the lead, in sixteenth notes (3+3+2 is the dotted feel of the maqsum)
      rhythms: [
        [3, 3, 2, 3, 3, 2],
        [2, 2, 4, 2, 2, 4],
        [4, 2, 2, 4, 2, 2],
        [3, 3, 2, 2, 2, 4],
      ],
    },
    horns: [
      [7, 11, 9, 7], //  C  G  E½♭ C  (an octave up)
      [7, 9, 11, 14],
      [11, 9, 7, 9, 7],
      [7, 7, 11, 9, 7],
    ],
    trim: 0.75, // the groove is denser than the home piece: keep the two at a similar loudness
  },
  // the stadium, second version — "modern desert": maqam HIJAZ on F in a rolling 6/8, a hand-clap and
  // frame-drum groove, a sub-bass pedal, a plucked cross-rhythm (four notes against the two beats) that
  // echoes like a call across dunes, a bowed rababa-like lead and wide dusty pads. See grooveDesert().
  desert: {
    tonic: 174.61, // F3
    // maqam Hijaz on F:  F  G♭  A  B♭  C  D♭  E♭   (the augmented second G♭–A is the desert's voice)
    cents: [0, 100, 400, 500, 700, 800, 1000],
    chords: [
      [0, 4, 9],
      [1, 5, 10],
      [0, 4, 9],
      [6, 10, 15],
    ],
    motifs: [
      [2, 1, 0, 1, 2],
      [4, 3, 2, 1, 0],
      [0, 1, 2, 1, 0],
      [2, 3, 4, 3, 2, 1, 0],
      [4, 2, 1, 0],
      [0, 1, 2, 4, 2, 1, 0],
    ],
    roots: [0, 0, 0, 1],
    resolves: [0, 0, 0, 2],
    ney: [7, 9, 11, 9],
    startIdx: 2,
    gap: [3, 6],
    sport: { bpm: 99 }, // a sixteenth = 0.1515 s; one 6/8 bar = 12 of them = 1.82 s
    modern: {
      kind: 'desert',
      steps: 12,
      echoBeats: 0.5,
      // chord roots of the four-bar loop (Hijaz degrees):  F  –  G♭  –  F  –  E♭   (I – ♭II – I – ♭VII)
      bars: [0, 1, 0, 6],
      // the plucked ostinato: 4 notes per bar (every 3 sixteenths = a hemiola over the 6/8 beats);
      // steps above the chord root, in the octave above the tonic — the 0-1-2 turn is the Hijaz sound
      arps: [
        [0, 1, 2, 1],
        [2, 1, 0, 1],
        [4, 2, 1, 2],
        [0, 2, 4, 2],
      ],
      rhythms: [
        [3, 3, 3, 3],
        [6, 3, 3],
        [4, 4, 4],
        [3, 3, 6],
        [2, 2, 2, 6],
      ],
    },
    horns: [
      [7, 8, 9, 8, 7],
      [7, 9, 11, 9],
      [11, 9, 8, 7],
    ],
    trim: 0.7,
  },
  // the home journey, third version — an ORIGINAL score in the spirit of an ancient epic (not a copy of any
  // film's music): maqam BAYATI on D over a deep D–A drone, with no orchestra at all — a plucked lyre, a
  // double-reed aulos, bronze, wood and a big frame drum beating like oars. It is built around the scroll:
  // a lone lyre call in the dust, the oar-stroke pulse waking as the journey starts, bronze and wood at the
  // dusk, and a long resolution on the black screen. See grooveOdyssey().
  odyssey: {
    tonic: 146.83, // D3
    cents: [0, 150, 300, 500, 700, 800, 1000], // D  E½♭  F  G  A  B♭  C
    chords: [[0, 4, 7]],
    motifs: [[4, 3, 2, 1, 0]],
    roots: [0],
    resolves: [0],
    ney: [11],
    startIdx: 4,
    gap: [3, 6],
    drone: 1.5, // a deep D–A drone under everything (the other modern pieces have none)
    sport: { bpm: 72 }, // one oar stroke per beat: a sixteenth = 0.208 s, a bar of 16 = 3.33 s
    modern: {
      kind: 'odyssey',
      echoBeats: 1, // a long, dark echo, like a hall of stone
      // chord roots of the 8-bar phrase (open fifths, never triads):  D D F D · D G F D
      bars: [0, 0, 2, 0, 0, 3, 2, 0],
      // the lyre's calls: [step from the start, scale index] (7 = D4, 4 = A3, 11 = A4, 14 = D5; 8 is the neutral E½♭)
      calls: [
        [[0, 4], [4, 7], [8, 10], [12, 11], [20, 9], [24, 8], [28, 7]], //   A  D  G  A ·  F  E½♭ D   — the invocation
        [[0, 7], [4, 11], [8, 14], [14, 13], [18, 11], [22, 10], [28, 7]], // D  A  D' C' A  G  D
        [[0, 9], [3, 11], [6, 10], [10, 9], [14, 8], [20, 7]], //             F  A  G  F  E½♭ D
        [[0, 11], [5, 10], [10, 11], [14, 9], [20, 8], [24, 7]], //           A  G  A  F  E½♭ D
      ],
      // the aulos lines: [step from the start, scale index, length in steps]
      lines: [
        [[0, 7, 6], [6, 9, 6], [12, 10, 4], [16, 11, 10], [26, 10, 4], [30, 7, 14]], //            D F G A· G D
        [[0, 11, 8], [8, 12, 4], [12, 11, 4], [16, 10, 6], [22, 9, 4], [26, 8, 6], [32, 7, 14]], // A B♭ A G F E½♭ D
        [[0, 14, 6], [6, 13, 6], [12, 11, 8], [20, 10, 4], [24, 11, 4], [28, 7, 14]], //            D' C' A G A D
      ],
      // the oar-stroke ostinato: hits on 3+3+4+3+3 sixteenths; scale steps above the chord root
      cell: [
        [4, 7, 11, 7, 9],
        [4, 7, 9, 11, 9],
        [4, 7, 8, 7, 4], // on the bars that come home to D: the neutral second (E½♭) is the colour of Bayati
      ],
      cellOf: [0, 0, 0, 2, 1, 1, 1, 2],
    },
    trim: 0.9,
  },
  // the stadium, third version — "athlete": an ORIGINAL score in the spirit of a modern film about ambition and
  // pressure (not a copy of any film's music): D Dorian over a deep D pedal, a relentless sixteenth-note string
  // ostinato that never lets go, timpani and a clock-like tick under it, brass swells that climb for four bars,
  // then an impact and the theme on the horns — the pressure builds with the scroll and breaks at the end.
  // At 144 bpm (a sixteenth = 0.104 s). See grooveAthlete().
  athlete: {
    tonic: 146.83, // D3
    cents: [0, 200, 300, 500, 700, 900, 1000], // D Dorian:  D  E  F  G  A  B  C
    chords: [[0, 2, 4]],
    motifs: [[0, 1, 2]],
    roots: [0],
    resolves: [0],
    ney: [11],
    startIdx: 7,
    gap: [3, 6],
    sport: { bpm: 144 },
    modern: {
      kind: 'athlete',
      echoBeats: 0.75, // a dotted-eighth echo on the long high notes
      // chord roots of the 8-bar phrase over the D pedal:  Dm · C · G · Dm  |  B° · C · Am · G
      bars: [0, 6, 3, 0, 5, 6, 4, 3],
      // the ostinato, 16 notes a bar: scale steps above the chord root (0-2-4 is its triad, 7 the octave)
      cells: [
        [0, 4, 2, 4, 0, 4, 2, 4, 0, 4, 2, 4, 0, 4, 2, 7], //   the grind: a triad turning over itself
        [0, 2, 4, 7, 2, 4, 7, 9, 4, 7, 9, 11, 7, 9, 11, 14], // the climb: a rising sequence, a step higher every beat
        [7, 4, 7, 9, 7, 4, 7, 11, 7, 4, 7, 9, 7, 11, 9, 7], //  the peak: high and tight
      ],
    },
    // the theme on the horns (scale index 7 = D4)
    horns: [
      [7, 9, 11, 14],
      [11, 10, 9, 7],
      [7, 11, 13, 11, 9],
    ],
    trim: 0.78,
  },
  // the harbour: a quiet piece for the projects without a 3D journey — maqam HIJAZ on G, sparse and
  // slow, with a sea breeze where the sand would be (no grains, no drum)
  port: {
    tonic: 196, // G3
    // maqam Hijaz on G:  G  A♭  B  C  D  E♭  F
    cents: [0, 100, 400, 500, 700, 800, 1000],
    chords: [
      [0, 4, 7],
      [0, 3, 5],
      [-3, 2, 4],
      [0, 4, 8],
    ],
    motifs: [
      [2, 1, 0, 1, 2],
      [4, 3, 2, 1, 0],
      [0, 1, 2, 3, 4],
      [2, 1, 0, 1, 2, 4, 2],
      [4, 2, 1, 0],
      [0, 0, 1, 2, 1, 0],
    ],
    roots: [0, 0, 0, 2, 4, 4],
    resolves: [0, 0, 0, 4, 2, 7],
    ney: [7, 11, 9, 11, 14],
    startIdx: 2,
    gap: [4.5, 9.5],
    noGrain: true,
  },
}

const rnd = (a, b) => a + Math.random() * (b - a)
const pick = (arr) => arr[(Math.random() * arr.length) | 0]
const clamp = (x, a, b) => Math.min(b, Math.max(a, x))

export function createEngine(ctx, moodName = 'malwiya') {
  const sr = ctx.sampleRate
  let M = MOODS[moodName] || MOODS.malwiya
  const note = (i) => M.tonic * Math.pow(2, (M.cents[((i % 7) + 7) % 7] + 1200 * Math.floor(i / 7)) / 1200)
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
  const pulseBus = mk.gain(0)
  const crowdBus = mk.gain(0)
  const driveBus = mk.gain(0)
  const rainBus = mk.gain(0)
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
  pulseBus.connect(mix)
  pulseBus.connect(reverbSend)
  crowdBus.connect(mix)
  crowdBus.connect(reverbSend)
  driveBus.connect(mix)
  driveBus.connect(reverbSend)
  rainBus.connect(mix)
  mix.connect(lpf)
  lpf.connect(comp)
  comp.connect(master)
  master.connect(ctx.destination)

  // ── mood epochs ───────────────────────────────────────────────────────────
  // Every voice of a piece (music, drums, groove, the cheer) goes through the gates of the epoch
  // it was composed in. When the piece changes (the home page → a project) the old gates are shut
  // at once, so even the notes already scheduled ahead are never heard inside the new place.
  const makeEpoch = (open) => {
    const e = { m: mk.gain(open ? 1 : 0), p: mk.gain(open ? 1 : 0), d: mk.gain(open ? 1 : 0), c: mk.gain(open ? 1 : 0) }
    e.m.connect(musicBus)
    e.p.connect(pulseBus)
    e.d.connect(driveBus)
    e.c.connect(crowdBus)
    // the modern piece: pad and bass go through a "duck" the kick pumps (side-chain), and the plucks
    // and the lead through a bus with a dotted-eighth echo. Both live inside the epoch, so the
    // echoes of a piece that has ended can never be heard in the next one.
    e.duck = mk.gain(1)
    e.duck.connect(e.m)
    e.lead = mk.gain(1)
    e.lead.connect(e.m)
    if (M.modern) {
      const dl = ctx.createDelay(2)
      dl.delayTime.value = (60 / M.sport.bpm) * (M.modern.echoBeats ?? 0.75)
      const tone = mk.filter('lowpass', 2300, 0.5)
      const fb = mk.gain(0.38)
      const wet = mk.gain(0.36)
      e.lead.connect(dl)
      dl.connect(tone)
      tone.connect(fb)
      fb.connect(dl)
      tone.connect(wet)
      wet.connect(e.m)
    }
    return e
  }
  let ep = makeEpoch(true)

  // ── drone: tonic + fifth, slowly breathing ────────────────────────────────
  const droneVoices = []
  const droneLp = mk.filter('lowpass', 480, 0.6)
  const droneLevel = () => (M.modern ? M.drone ?? 0 : 1) // the modern pieces have their own bass (the Odyssey keeps the drone)
  const droneTrim = mk.gain(droneLevel())
  droneLp.connect(droneTrim)
  {
    const dronePre = mk.gain(0.058)
    dronePre.connect(droneLp)
    droneTrim.connect(ep.m)
    const breathe = mk.osc('sine', 0.045)
    const breatheG = mk.gain(0.025)
    breathe.connect(breatheG)
    breatheG.connect(dronePre.gain)
    breathe.start()
    for (const [fn, g] of [
      [() => M.tonic / 2, 1],
      [() => note(4) / 2, 0.55],
      [() => M.tonic, 0.3],
    ]) {
      for (const [type, det, gv] of [
        ['sawtooth', -5, 0.35],
        ['triangle', 4, 0.8],
      ]) {
        const o = mk.osc(type, fn())
        o.detune.value = det
        const og = mk.gain(g * gv)
        o.connect(og)
        og.connect(dronePre)
        o.start()
        droneVoices.push([o, fn])
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

  // ── rain (night mode): a soft hiss, a patter of drops and a slow swell ──────────────────
  {
    // a loop of sparse random drops, softened
    const drops = ctx.createBuffer(1, sr * 3, sr)
    {
      const d = drops.getChannelData(0)
      let lp = 0
      for (let i = 0; i < d.length; i++) {
        const hit = Math.random() < 520 / sr ? (0.35 + Math.random() * 0.65) * (Math.random() < 0.5 ? -1 : 1) : 0
        lp += (hit - lp) * 0.55
        d[i] = lp
      }
    }
    const [hissSrc] = noise(true)
    const hp = mk.filter('highpass', 1700, 0.5)
    const lp = mk.filter('lowpass', 9500, 0.5)
    const hissG = mk.gain(0.34)
    const swell = mk.osc('sine', 0.09)
    const swellG = mk.gain(0.07)
    swell.connect(swellG)
    swellG.connect(hissG.gain)
    hissSrc.connect(hp)
    hp.connect(lp)
    lp.connect(hissG)
    hissG.connect(rainBus)
    hissSrc.start(0, 0.9)
    swell.start()

    const patter = ctx.createBufferSource()
    patter.buffer = drops
    patter.loop = true
    const pbp = mk.filter('bandpass', 2400, 0.8)
    const pg = mk.gain(1.1)
    patter.connect(pbp)
    pbp.connect(pg)
    pg.connect(rainBus)
    patter.start(0, 0.3)

    const rumble = noise(true)[0]
    const rlp = mk.filter('lowpass', 420, 0.6)
    const rg = mk.gain(0.22)
    rumble.connect(rlp)
    rlp.connect(rg)
    rg.connect(rainBus)
    rumble.start(0, 2.1)
  }

  // ── the crowd: a wide roar that swells and settles, and a murmur that chants in time ─────
  {
    const [src] = noise(true)
    const bp = mk.filter('bandpass', 760, 0.45)
    const lp2 = mk.filter('lowpass', 2600, 0.6)
    const g = mk.gain(0.5)
    for (const [fr, am] of [
      [0.057, 0.2],
      [0.151, 0.1],
    ]) {
      const l = mk.osc('sine', fr)
      const lg = mk.gain(am)
      l.connect(lg)
      lg.connect(g.gain)
      l.start()
    }
    src.connect(bp)
    bp.connect(lp2)
    lp2.connect(g)
    g.connect(crowdBus)
    src.start(0, 0.9)

    // the chant: two vowel-like bands, switched on and off at the speed of eighth notes
    const [chant] = noise(true)
    const f1 = mk.filter('bandpass', 640, 4)
    const f2 = mk.filter('bandpass', 1300, 5)
    const am = mk.gain(0.16)
    const lfo = mk.osc('sine', 3.333)
    const lfoG = mk.gain(0.15)
    const phrasing = mk.osc('sine', 0.21)
    const phrasingG = mk.gain(0.08)
    lfo.connect(lfoG)
    lfoG.connect(am.gain)
    phrasing.connect(phrasingG)
    phrasingG.connect(am.gain)
    chant.connect(f1)
    chant.connect(f2)
    f1.connect(am)
    f2.connect(am)
    am.connect(crowdBus)
    chant.start(0, 2.1)
    lfo.start()
    phrasing.start()
  }

  // ── voices ───────────────────────────────────────────────────────────────
  const log = []
  const live = [] // long voices (pad, ney) that must fade out when the mood changes
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
    g.connect(ep.m)
    // pick noise
    const [s] = noise()
    const cb = mk.filter('bandpass', 2300, 1.2)
    const cg = mk.gain(0)
    cg.gain.setValueAtTime(0.0001, t)
    cg.gain.linearRampToValueAtTime(0.06 * vel, t + 0.002)
    cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.03)
    s.connect(cb)
    cb.connect(cg)
    cg.connect(ep.m)
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
    g.connect(ep.m)
    live.push([g, t + dur + 2.5])
  }

  function pad(t, idxs, dur) {
    const lp = mk.filter('lowpass', 1000, 0.5)
    const g = mk.gain(0)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.026, t + 6)
    g.gain.setValueAtTime(0.026, t + dur - 8)
    g.gain.linearRampToValueAtTime(0.0001, t + dur)
    lp.connect(g)
    g.connect(ep.m)
    live.push([g, t + dur + 0.2])
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


  // low frame-drum: a soft "doum" with a pitch drop, and a faint dry "tek"
  function doum(t, vel) {
    const o = mk.osc('sine', 118)
    o.frequency.setValueAtTime(118, t)
    o.frequency.exponentialRampToValueAtTime(46, t + 0.2)
    const g = mk.gain(0)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.5 * vel, t + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55)
    o.connect(g)
    g.connect(ep.p)
    o.start(t)
    o.stop(t + 0.6)
    const [s] = noise()
    const f = mk.filter('lowpass', 520, 0.7)
    const ng = mk.gain(0)
    ng.gain.setValueAtTime(0.0001, t)
    ng.gain.linearRampToValueAtTime(0.16 * vel, t + 0.004)
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.07)
    s.connect(f)
    f.connect(ng)
    ng.connect(ep.p)
    s.start(t, rnd(0, 3))
    s.stop(t + 0.09)
  }
  function tek(t, vel) {
    const [s] = noise()
    const f = mk.filter('bandpass', 3100, 1.3)
    const g = mk.gain(0)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.1 * vel, t + 0.002)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
    s.connect(f)
    f.connect(g)
    g.connect(ep.p)
    s.start(t, rnd(0, 3))
    s.stop(t + 0.07)
  }

  // ── the stadium's voices ─────────────────────────────────────────────────
  // thousands of hands: a dozen tiny claps landing within a few hundredths of a second
  function clap(t, vel) {
    for (let k = 0; k < 7; k++) {
      const at = t + rnd(0, 0.03)
      const [s] = noise()
      const f = mk.filter('bandpass', rnd(1100, 2900), 0.9)
      const g = mk.gain(0)
      g.gain.setValueAtTime(0.0001, at)
      g.gain.linearRampToValueAtTime(rnd(0.05, 0.1) * vel, at + 0.002)
      g.gain.exponentialRampToValueAtTime(0.0001, at + rnd(0.07, 0.15))
      s.connect(f)
      f.connect(g)
      g.connect(ep.d)
      s.start(at, rnd(0, 3))
      s.stop(at + 0.2)
    }
  }
  // a tom for the fills
  function tom(t, f0, vel) {
    const o = mk.osc('sine', f0)
    o.frequency.setValueAtTime(f0 * 1.25, t)
    o.frequency.exponentialRampToValueAtTime(f0, t + 0.07)
    const g = mk.gain(0)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.3 * vel, t + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26)
    o.connect(g)
    g.connect(ep.d)
    o.start(t)
    o.stop(t + 0.3)
    const [s] = noise()
    const nf = mk.filter('bandpass', 1800, 1.2)
    const ng = mk.gain(0)
    ng.gain.setValueAtTime(0.0001, t)
    ng.gain.linearRampToValueAtTime(0.05 * vel, t + 0.002)
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
    s.connect(nf)
    nf.connect(ng)
    ng.connect(ep.d)
    s.start(t, rnd(0, 3))
    s.stop(t + 0.07)
  }
  // a brass-like horn: two detuned saws and a square, opened by a quick filter sweep
  function horn(t, f, dur, vel = 0.7) {
    log.push([t, f, vel])
    const g = mk.gain(0)
    const lp = mk.filter('lowpass', 600, 0.9)
    lp.frequency.setValueAtTime(520, t)
    lp.frequency.linearRampToValueAtTime(2700, t + 0.11)
    lp.frequency.exponentialRampToValueAtTime(1400, t + dur)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.1 * vel, t + 0.05)
    g.gain.setValueAtTime(0.085 * vel, t + Math.max(0.06, dur - 0.1))
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.22)
    const vib = mk.osc('sine', 5.1)
    const vg = mk.gain(0)
    vg.gain.setValueAtTime(0, t)
    vg.gain.linearRampToValueAtTime(9, t + dur * 0.7)
    vib.connect(vg)
    vib.start(t)
    vib.stop(t + dur + 0.3)
    for (const [type, det, gv] of [
      ['sawtooth', -8, 0.5],
      ['sawtooth', 8, 0.5],
      ['square', 0, 0.16],
    ]) {
      const o = mk.osc(type, f)
      o.detune.value = det
      vg.connect(o.detune)
      const og = mk.gain(gv)
      o.connect(og)
      og.connect(lp)
      o.start(t)
      o.stop(t + dur + 0.3)
    }
    lp.connect(g)
    g.connect(ep.d)
  }
  // a short call from the horns, in step with the groove
  function fanfare(t, step) {
    const m = pick(M.horns)
    m.forEach((deg, k) => {
      const last = k === m.length - 1
      horn(t + k * 4 * step, note(deg), last ? 9 * step : 3.6 * step, last ? 0.85 : 0.7)
    })
  }
  // the referee's whistle, then the stands erupt
  function whistle(t) {
    const o = mk.osc('sine', 2950)
    const trill = mk.osc('sine', 31)
    const tg = mk.gain(210)
    trill.connect(tg)
    tg.connect(o.frequency)
    const g = mk.gain(0)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.06, t + 0.02)
    g.gain.setValueAtTime(0.06, t + 0.34)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.46)
    o.connect(g)
    g.connect(ep.d)
    o.start(t)
    o.stop(t + 0.5)
    trill.start(t)
    trill.stop(t + 0.5)
  }
  function cheer() {
    if (!M.sport) return
    const t = ctx.currentTime + 0.05
    whistle(t)
    const [s] = noise(true)
    const bp = mk.filter('bandpass', 520, 0.55)
    bp.frequency.setValueAtTime(520, t + 0.3)
    bp.frequency.exponentialRampToValueAtTime(1500, t + 2.4)
    bp.frequency.exponentialRampToValueAtTime(700, t + 6.5)
    const g = mk.gain(0)
    g.gain.setValueAtTime(0.0001, t + 0.3)
    g.gain.linearRampToValueAtTime(0.85, t + 2.2)
    g.gain.setValueAtTime(0.85, t + 3.3)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 7)
    s.connect(bp)
    bp.connect(g)
    g.connect(ep.c)
    s.start(t, rnd(0, 2))
    s.stop(t + 7.2)
  }

  // ── the modern stadium's voices ───────────────────────────────────────────
  // a soft kick: a sub thump that drops in pitch, a small click, and the pump that ducks pad + bass
  function kick(t, vel) {
    const o = mk.osc('sine', 150)
    o.frequency.setValueAtTime(150, t)
    o.frequency.exponentialRampToValueAtTime(50, t + 0.13)
    const g = mk.gain(0)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.46 * vel, t + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4)
    o.connect(g)
    g.connect(ep.p)
    o.start(t)
    o.stop(t + 0.44)
    const [s] = noise()
    const f = mk.filter('bandpass', 2300, 0.9)
    const ng = mk.gain(0)
    ng.gain.setValueAtTime(0.0001, t)
    ng.gain.linearRampToValueAtTime(0.12 * vel, t + 0.001)
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.022)
    s.connect(f)
    f.connect(ng)
    ng.connect(ep.p)
    s.start(t, rnd(0, 3))
    s.stop(t + 0.04)
    const dg = ep.duck.gain
    dg.setValueAtTime(1, t)
    dg.linearRampToValueAtTime(1 - 0.5 * vel, t + 0.012)
    dg.linearRampToValueAtTime(1, t + 0.34)
  }
  // darbuka "tak": a dry, bright slap with a tiny ring; "ka" is its soft ghost note
  function tak(t, vel) {
    const [s] = noise()
    const f = mk.filter('bandpass', 3400, 1.4)
    const g = mk.gain(0)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.15 * vel, t + 0.002)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06)
    s.connect(f)
    f.connect(g)
    g.connect(ep.p)
    s.start(t, rnd(0, 3))
    s.stop(t + 0.08)
    const o = mk.osc('sine', 1500)
    o.frequency.setValueAtTime(1500, t)
    o.frequency.exponentialRampToValueAtTime(980, t + 0.05)
    const og = mk.gain(0)
    og.gain.setValueAtTime(0.0001, t)
    og.gain.linearRampToValueAtTime(0.035 * vel, t + 0.002)
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.06)
    o.connect(og)
    og.connect(ep.p)
    o.start(t)
    o.stop(t + 0.08)
  }
  function ka(t, vel) {
    const [s] = noise()
    const f = mk.filter('bandpass', 2100, 1.1)
    const g = mk.gain(0)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.07 * vel, t + 0.002)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.038)
    s.connect(f)
    f.connect(g)
    g.connect(ep.p)
    s.start(t, rnd(0, 3))
    s.stop(t + 0.06)
  }
  // a shaker: a breath of high noise with a soft attack
  function shaker(t, vel) {
    const [s] = noise()
    const f = mk.filter('highpass', 6800, 0.5)
    const g = mk.gain(0)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.08 * vel, t + 0.009)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07)
    s.connect(f)
    f.connect(g)
    g.connect(ep.d)
    s.start(t, rnd(0, 3))
    s.stop(t + 0.09)
  }
  // a riser (noise opening up) into the next phrase, and an impact (boom + cymbal wash) on its first beat
  function riser(t, dur, vel) {
    const [s] = noise(true)
    const bp = mk.filter('bandpass', 500, 1.2)
    bp.frequency.setValueAtTime(500, t)
    bp.frequency.exponentialRampToValueAtTime(7200, t + dur)
    const g = mk.gain(0)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.12 * vel, t + dur)
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.05)
    s.connect(bp)
    bp.connect(g)
    g.connect(ep.d)
    s.start(t, rnd(0, 2))
    s.stop(t + dur + 0.1)
  }
  function impact(t, vel) {
    const o = mk.osc('sine', 92)
    o.frequency.setValueAtTime(92, t)
    o.frequency.exponentialRampToValueAtTime(38, t + 0.9)
    const g = mk.gain(0)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.4 * vel, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3)
    o.connect(g)
    g.connect(ep.d)
    o.start(t)
    o.stop(t + 1.4)
    const [s] = noise()
    const hp = mk.filter('highpass', 4800, 0.6)
    const ng = mk.gain(0)
    ng.gain.setValueAtTime(0.0001, t)
    ng.gain.linearRampToValueAtTime(0.07 * vel, t + 0.004)
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 1.5)
    s.connect(hp)
    hp.connect(ng)
    ng.connect(ep.d)
    s.start(t, rnd(0, 2))
    s.stop(t + 1.6)
  }
  // sub-bass: a sine with a little 2nd harmonic and a darkened saw so a small speaker still hears it
  function bass(t, f, dur, vel) {
    log.push([t, f, vel])
    const g = mk.gain(0)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.34 * vel, t + 0.012)
    g.gain.setValueAtTime(0.29 * vel, t + Math.max(0.03, dur - 0.08))
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.1)
    const lp = mk.filter('lowpass', 460, 0.7)
    lp.connect(g)
    for (const [type, mul, gv, dest] of [
      ['sine', 1, 1, g],
      ['triangle', 2, 0.32, g],
      ['sawtooth', 1, 0.2, lp],
    ]) {
      const o = mk.osc(type, f * mul)
      const og = mk.gain(gv)
      o.connect(og)
      og.connect(dest)
      o.start(t)
      o.stop(t + dur + 0.15)
    }
    g.connect(ep.duck)
  }
  // an airy pad: detuned saws, a filter that opens and closes with the bar
  function mpad(t, idxs, dur) {
    const lp = mk.filter('lowpass', 480, 0.8)
    lp.frequency.setValueAtTime(480, t)
    lp.frequency.linearRampToValueAtTime(2000, t + dur * 0.5)
    lp.frequency.linearRampToValueAtTime(620, t + dur)
    const g = mk.gain(0)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.07, t + 0.9)
    g.gain.setValueAtTime(0.07, t + dur - 1.3)
    g.gain.linearRampToValueAtTime(0.0001, t + dur)
    lp.connect(g)
    g.connect(ep.duck)
    live.push([g, t + dur + 0.2])
    for (const i of idxs) {
      for (const det of [-9, 9]) {
        const o = mk.osc('sawtooth', note(i))
        o.detune.value = det
        const og = mk.gain(0.5)
        o.connect(og)
        og.connect(lp)
        o.start(t)
        o.stop(t + dur + 0.1)
      }
    }
  }
  // a qanun / oud-like synth pluck: a bright attack that closes quickly, then an echo
  function pluck(t, f, vel, dur = 0.8) {
    log.push([t, f, vel])
    const g = mk.gain(0)
    const lp = mk.filter('lowpass', 800 + 4200 * vel, 0.9)
    lp.frequency.setValueAtTime(800 + 4200 * vel, t)
    lp.frequency.exponentialRampToValueAtTime(520, t + 0.3)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.42 * vel, t + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    for (const [type, det, mul, gv] of [
      ['triangle', 0, 1, 0.75],
      ['sawtooth', 5, 1, 0.3],
      ['triangle', -3, 2, 0.22],
    ]) {
      const o = mk.osc(type, f * mul * 1.008)
      o.frequency.setValueAtTime(f * mul * 1.008, t)
      o.frequency.exponentialRampToValueAtTime(f * mul, t + 0.03)
      o.detune.value = det
      const og = mk.gain(gv)
      o.connect(og)
      og.connect(lp)
      o.start(t)
      o.stop(t + dur + 0.1)
    }
    lp.connect(g)
    g.connect(ep.lead)
    const [s] = noise()
    const cb = mk.filter('bandpass', 3000, 1.1)
    const cg = mk.gain(0)
    cg.gain.setValueAtTime(0.0001, t)
    cg.gain.linearRampToValueAtTime(0.045 * vel, t + 0.002)
    cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.025)
    s.connect(cb)
    cb.connect(cg)
    cg.connect(ep.lead)
    s.start(t, rnd(0, 3))
    s.stop(t + 0.05)
  }
  // the lead: a reedy, slightly nasal voice (a mizmar played softly) that scoops up into each note;
  // `bowed` makes it a rababa instead: a slow bow, a deep vibrato, a long glide and a little bow noise
  function lead(t, f, dur, vel = 0.7, slide = 0, bowed = false) {
    log.push([t, f, vel])
    const atk = bowed ? 0.17 : 0.035
    const g = mk.gain(0)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime((bowed ? 0.15 : 0.16) * vel, t + atk)
    g.gain.setValueAtTime((bowed ? 0.13 : 0.14) * vel, t + Math.max(atk + 0.02, dur - 0.06))
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + (bowed ? 0.4 : 0.22))
    const lp = mk.filter('lowpass', bowed ? 1500 : 1900, 0.8)
    lp.frequency.setValueAtTime(bowed ? 700 : 900, t)
    lp.frequency.linearRampToValueAtTime(bowed ? 2000 : 2300, t + (bowed ? 0.4 : 0.12))
    const pk = mk.filter('peaking', bowed ? 900 : 1150, 2.2)
    pk.gain.value = bowed ? 4 : 6
    const vib = mk.osc('sine', bowed ? 4.9 : 5.4)
    const vg = mk.gain(0)
    vg.gain.setValueAtTime(0, t)
    vg.gain.setValueAtTime(0, t + (bowed ? 0.22 : 0.16))
    vg.gain.linearRampToValueAtTime(bowed ? 26 : 15, t + (bowed ? 0.22 : 0.16) + Math.min(0.6, dur * 0.6))
    vib.connect(vg)
    vib.start(t)
    vib.stop(t + dur + 0.6)
    for (const [type, det, gv] of [
      ['sawtooth', bowed ? -5 : -7, 0.5],
      ['sawtooth', bowed ? 5 : 7, 0.5],
      ['triangle', 0, 0.5],
    ]) {
      const o = mk.osc(type, f)
      const start = f * Math.pow(2, -slide / 1200)
      o.frequency.setValueAtTime(start, t)
      if (slide) o.frequency.exponentialRampToValueAtTime(f, t + (bowed ? 0.16 : 0.075))
      o.detune.value = det
      vg.connect(o.detune)
      const og = mk.gain(gv)
      o.connect(og)
      og.connect(lp)
      o.start(t)
      o.stop(t + dur + 0.6)
    }
    if (bowed) {
      const [s] = noise(true)
      const bp = mk.filter('bandpass', f * 2.2, 3)
      const bg = mk.gain(0)
      bg.gain.setValueAtTime(0.0001, t)
      bg.gain.linearRampToValueAtTime(0.03 * vel, t + 0.12)
      bg.gain.setValueAtTime(0.022 * vel, t + dur)
      bg.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.3)
      s.connect(bp)
      bp.connect(bg)
      bg.connect(lp)
      s.start(t, rnd(0, 2))
      s.stop(t + dur + 0.5)
    }
    lp.connect(pk)
    pk.connect(g)
    g.connect(ep.lead)
  }
  // a long, breathy note over the calm bars (a ney made of sine waves)
  function air(t, f, dur, vel = 0.6) {
    log.push([t, f, vel])
    const g = mk.gain(0)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.14 * vel, t + 0.45)
    g.gain.setValueAtTime(0.14 * vel, t + dur)
    g.gain.setTargetAtTime(0.0001, t + dur, 0.35)
    const vib = mk.osc('sine', 5.2)
    const vg = mk.gain(0)
    vg.gain.setValueAtTime(0, t + 0.3)
    vg.gain.linearRampToValueAtTime(12, t + dur * 0.6)
    vib.connect(vg)
    vib.start(t)
    vib.stop(t + dur + 2)
    const lp = mk.filter('lowpass', 3600, 0.5)
    for (const [mul, gv] of [
      [1, 1],
      [2, 0.14],
    ]) {
      const o = mk.osc('sine', f * mul)
      o.frequency.setValueAtTime(f * mul * 0.985, t)
      o.frequency.setTargetAtTime(f * mul, t, 0.08)
      vg.connect(o.detune)
      const og = mk.gain(gv)
      o.connect(og)
      og.connect(lp)
      o.start(t)
      o.stop(t + dur + 2)
    }
    const [s] = noise(true)
    const bp = mk.filter('bandpass', f * 2.4, 2.2)
    const bg = mk.gain(0)
    bg.gain.setValueAtTime(0.0001, t)
    bg.gain.linearRampToValueAtTime(0.045 * vel, t + 0.3)
    bg.gain.setValueAtTime(0.035 * vel, t + dur)
    bg.gain.setTargetAtTime(0.0001, t + dur, 0.3)
    s.connect(bp)
    bp.connect(bg)
    bg.connect(lp)
    s.start(t, rnd(0, 2))
    s.stop(t + dur + 2)
    lp.connect(g)
    g.connect(ep.lead)
  }

  // ── the Odyssey piece's voices (no synth leads, no kick: strings, reeds, skin, bronze, wood) ─────────
  // a big frame drum: a deep skin thump that sinks in pitch, the ring of the membrane and the slap of a hand
  function frame(t, vel, slap = 1) {
    const o = mk.osc('sine', 106)
    o.frequency.setValueAtTime(106, t)
    o.frequency.exponentialRampToValueAtTime(52, t + 0.3)
    const g = mk.gain(0)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.5 * vel, t + 0.007)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85)
    o.connect(g)
    g.connect(ep.p)
    o.start(t)
    o.stop(t + 0.9)
    const ring = mk.osc('triangle', 176)
    ring.frequency.setValueAtTime(190, t)
    ring.frequency.exponentialRampToValueAtTime(148, t + 0.22)
    const rg = mk.gain(0)
    rg.gain.setValueAtTime(0.0001, t)
    rg.gain.linearRampToValueAtTime(0.1 * vel, t + 0.005)
    rg.gain.exponentialRampToValueAtTime(0.0001, t + 0.34)
    ring.connect(rg)
    rg.connect(ep.p)
    ring.start(t)
    ring.stop(t + 0.4)
    const [s] = noise()
    const f = mk.filter('bandpass', 760, 0.8)
    const ng = mk.gain(0)
    ng.gain.setValueAtTime(0.0001, t)
    ng.gain.linearRampToValueAtTime(0.17 * vel * slap, t + 0.003)
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.075)
    s.connect(f)
    f.connect(ng)
    ng.connect(ep.p)
    s.start(t, rnd(0, 3))
    s.stop(t + 0.1)
  }
  // a wooden clack (two sizes of block) and a tick of struck bronze, for the off-beats
  function wood(t, vel, hi = false) {
    const f0 = hi ? 1240 : 830
    const o = mk.osc('sine', f0 * 1.16)
    o.frequency.setValueAtTime(f0 * 1.16, t)
    o.frequency.exponentialRampToValueAtTime(f0, t + 0.014)
    const g = mk.gain(0)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.15 * vel, t + 0.002)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.075)
    o.connect(g)
    g.connect(ep.d)
    o.start(t)
    o.stop(t + 0.1)
    const [s] = noise()
    const bp = mk.filter('bandpass', 2500, 1.4)
    const ng = mk.gain(0)
    ng.gain.setValueAtTime(0.0001, t)
    ng.gain.linearRampToValueAtTime(0.07 * vel, t + 0.001)
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.022)
    s.connect(bp)
    bp.connect(ng)
    ng.connect(ep.d)
    s.start(t, rnd(0, 3))
    s.stop(t + 0.04)
  }
  function shield(t, vel) {
    for (const [mul, gv, dec] of [
      [1, 0.5, 0.2],
      [1.47, 0.36, 0.14],
      [2.09, 0.24, 0.1],
      [2.86, 0.14, 0.07],
    ]) {
      const o = mk.osc('sine', 1560 * mul)
      const g = mk.gain(0)
      g.gain.setValueAtTime(0.0001, t)
      g.gain.linearRampToValueAtTime(0.06 * vel * gv, t + 0.002)
      g.gain.exponentialRampToValueAtTime(0.0001, t + dec)
      o.connect(g)
      g.connect(ep.d)
      o.start(t)
      o.stop(t + dec + 0.05)
    }
  }
  // a bronze bell / gong tuned to the drone: the fundamental, its fifth and octave, and a shimmer above that fades first
  function bronze(t, f, vel, dur = 5) {
    const g = mk.gain(0)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.2 * vel, t + 0.012)
    g.connect(ep.m)
    for (const [mul, gv, life] of [
      [1, 1, 1],
      [1.498, 0.55, 0.8],
      [2, 0.42, 0.62],
      [2.997, 0.22, 0.4],
      [4.13, 0.1, 0.22],
      [5.43, 0.06, 0.14],
    ]) {
      const o = mk.osc('sine', f * mul * 1.006)
      o.frequency.setValueAtTime(f * mul * 1.006, t)
      o.frequency.exponentialRampToValueAtTime(f * mul, t + 0.09)
      const og = mk.gain(0)
      og.gain.setValueAtTime(0.0001, t)
      og.gain.linearRampToValueAtTime(gv, t + 0.006)
      og.gain.exponentialRampToValueAtTime(0.0001, t + dur * life)
      o.connect(og)
      og.connect(g)
      o.start(t)
      o.stop(t + dur * life + 0.1)
    }
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    const [s] = noise()
    const bp = mk.filter('bandpass', 1500, 0.8)
    const ng = mk.gain(0)
    ng.gain.setValueAtTime(0.0001, t)
    ng.gain.linearRampToValueAtTime(0.06 * vel, t + 0.003)
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.16)
    s.connect(bp)
    bp.connect(ng)
    ng.connect(ep.m)
    s.start(t, rnd(0, 3))
    s.stop(t + 0.2)
  }
  // a lyre: a plucked string, its overtones dying one after another (the high ones first)
  function lyre(t, f, vel = 0.7, dur = 2.6) {
    log.push([t, f, vel])
    const det = rnd(-3, 3)
    for (const [k, gv, life] of [
      [1, 1, 1],
      [2, 0.5, 0.7],
      [3, 0.28, 0.45],
      [4, 0.15, 0.3],
      [5, 0.08, 0.2],
    ]) {
      const o = mk.osc('sine', f * k * (1 + 0.0004 * k * k))
      o.detune.value = det
      const g = mk.gain(0)
      g.gain.setValueAtTime(0.0001, t)
      g.gain.linearRampToValueAtTime(0.13 * vel * gv, t + 0.003)
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur * life)
      o.connect(g)
      g.connect(ep.lead)
      o.start(t)
      o.stop(t + dur * life + 0.1)
    }
    const [s] = noise()
    const bp = mk.filter('bandpass', 2700, 1)
    const ng = mk.gain(0)
    ng.gain.setValueAtTime(0.0001, t)
    ng.gain.linearRampToValueAtTime(0.045 * vel, t + 0.002)
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.03)
    s.connect(bp)
    bp.connect(ng)
    ng.connect(ep.lead)
    s.start(t, rnd(0, 3))
    s.stop(t + 0.05)
  }
  // an aulos: a double reed — two detuned reeds beating against each other, a nasal formant, a slow vibrato
  function aulos(t, f, dur, vel = 0.7, slide = 0) {
    log.push([t, f, vel])
    const g = mk.gain(0)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.15 * vel, t + 0.11)
    g.gain.setValueAtTime(0.13 * vel, t + Math.max(0.14, dur - 0.1))
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.35)
    const lp = mk.filter('lowpass', 1750, 0.8)
    lp.frequency.setValueAtTime(800, t)
    lp.frequency.linearRampToValueAtTime(2000, t + 0.35)
    const pk = mk.filter('peaking', 1250, 2)
    pk.gain.value = 7
    const vib = mk.osc('sine', 4.6)
    const vg = mk.gain(0)
    vg.gain.setValueAtTime(0, t)
    vg.gain.setValueAtTime(0, t + 0.3)
    vg.gain.linearRampToValueAtTime(15, t + 0.3 + Math.min(0.8, dur * 0.5))
    vib.connect(vg)
    vib.start(t)
    vib.stop(t + dur + 0.5)
    for (const [type, det, gv] of [
      ['sawtooth', -11, 0.5],
      ['sawtooth', 11, 0.5],
      ['square', 0, 0.12],
    ]) {
      const o = mk.osc(type, f)
      o.frequency.setValueAtTime(f * Math.pow(2, -slide / 1200), t)
      if (slide) o.frequency.exponentialRampToValueAtTime(f, t + 0.1)
      o.detune.value = det
      vg.connect(o.detune)
      const og = mk.gain(gv)
      o.connect(og)
      og.connect(lp)
      o.start(t)
      o.stop(t + dur + 0.5)
    }
    const [s] = noise(true)
    const bp = mk.filter('bandpass', f * 2.4, 2.5)
    const bg = mk.gain(0)
    bg.gain.setValueAtTime(0.0001, t)
    bg.gain.linearRampToValueAtTime(0.03 * vel, t + 0.1)
    bg.gain.setValueAtTime(0.02 * vel, t + dur)
    bg.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.3)
    s.connect(bp)
    bp.connect(bg)
    bg.connect(lp)
    s.start(t, rnd(0, 2))
    s.stop(t + dur + 0.5)
    lp.connect(pk)
    pk.connect(g)
    g.connect(ep.lead)
  }
  // a slow swell of open fifths (triangle + sine: like voices humming, never a synth pad)
  function opad(t, idxs, dur, vel = 1) {
    const lp = mk.filter('lowpass', 760, 0.6)
    lp.frequency.setValueAtTime(700, t)
    lp.frequency.linearRampToValueAtTime(1350, t + dur * 0.5)
    lp.frequency.linearRampToValueAtTime(760, t + dur)
    const g = mk.gain(0)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.055 * vel, t + dur * 0.45)
    g.gain.linearRampToValueAtTime(0.0001, t + dur)
    lp.connect(g)
    g.connect(ep.m)
    live.push([g, t + dur + 0.2])
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
        o.stop(t + dur + 0.1)
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
    idx: M.startIdx,
    nextBeat: 0.4,
    beatN: 0,
    nextPhrase: 1.2,
    nextNey: 7,
    nextPad: 0.2,
    nextGrain: 0.2,
    padN: 0,
    nextStep: 0.4, // the stadium groove: sixteenth notes
    stepN: 0,
    level: { wind: 0, music: 0.4, clarity: 1, pulse: 0, crowd: 0, drive: 0, rain: 0, end: 0 },
    finalHit: false,
    lastCall: -1,
  }
  function phrase(t0) {
    let t = t0
    let i = state.idx
    const seq = []
    // sometimes lift the gesture into the upper register (G–A–B♭–C–D is Bayati's upper jins)
    const root = pick(M.roots)
    if (Math.random() < 0.65) seq.push(...pick(M.motifs).map((d) => d + root))
    const extra = 1 + ((Math.random() * 3) | 0)
    for (let k = 0; k < extra; k++) {
      const from = seq.length ? seq[seq.length - 1] : i
      const steps = from < 4 ? [0, 1, 1, 2, 2, 3] : from > 9 ? [-3, -2, -2, -1, -1, 0] : [-2, -1, -1, 0, 1, 1, 2]
      i = clamp(from + pick(steps), 0, 12)
      seq.push(i)
    }
    seq.push(pick(M.resolves)) // resolve on the tonic, or pause on the fifth / the neutral degree
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

  // ── the modern stadium piece ──────────────────────────────────────────────
  // One bar = 16 sixteenths at 104 bpm (2.3 s); the chord changes every bar (I – vi – IV – V in Rast),
  // and eight bars make a phrase. Everything below is on the grid, so it sounds composed, not random:
  //
  //   kick      x . . . . . . . x . . . . . . .       the heartbeat (pumps the pad and the bass)
  //   darbuka   . . t . . . t . . . . . t . . .       the teks of the maqsum, with soft ghosts between
  //   claps     . . . . x . . . . . . . x . . .       beats 2 and 4, once the crowd is awake
  //   shaker    sixteenths, accented off the beat
  //   bass      root, then a syncopated fifth and octave as the energy rises
  //   arpeggio  x . . x . . x . x . . x . . x .       the 3+3+2 pluck over the chord, echoing
  //   lead      bar 3 and bar 7 of the phrase: a reedy melody in the scale of Rast, ending on a chord tone
  //   air       bars 5–6: one long breathy note — the calm
  //   riser / impact, a tom roll and (at the peak) brass mark the turn of the phrase
  const chordIdx = (r) => [r, r + 4, r + 9]
  // the chord tone of root r nearest to scale step "near" (within the lead's register)
  function nearestTone(r, near) {
    let best = r + 14
    for (const base of [r, r + 2, r + 4]) {
      for (let k = 1; k <= 3; k++) {
        const c = base + 7 * k
        if (c >= 12 && c <= 21 && Math.abs(c - near) < Math.abs(best - near)) best = c
      }
    }
    return best
  }
  function melody(t0, r, step, vel) {
    const bowed = M.modern.kind === 'desert'
    const rhythm = pick(M.modern.rhythms)
    // the motif, cut where it would run past a bar and a half (the last note is then a chord tone)
    const full = pick(M.motifs)
    const motif = []
    let span = 0
    for (let k = 0; k < full.length; k++) {
      motif.push(full[k])
      span += rhythm[k % rhythm.length]
      if (span >= (bowed ? 18 : 16)) break
    }
    let at = 0
    let prev = 14 + motif[0]
    motif.forEach((deg, k) => {
      const last = k === motif.length - 1
      const idx = last ? nearestTone(r, prev) : 14 + deg
      const steps = rhythm[k % rhythm.length] + (last ? 5 : 0)
      const t = t0 + at * step
      const f = note(idx)
      if (!last && steps >= 3 && Math.random() < 0.3) {
        // a quick mordent: the upper neighbour, then the note
        lead(t, note(idx + 1), step * 0.7, vel * 0.55, 0, bowed)
        lead(t + step * 0.6, f, steps * step - step * 0.6, vel * (k === 0 ? 1 : 0.85), 0, bowed)
      } else {
        lead(t, f, steps * step * 0.94, vel * (k === 0 ? 1 : last ? 0.9 : 0.8), pick(bowed ? [0, 100, 200, 300] : [0, 0, 100, 150, 200]), bowed)
      }
      prev = idx
      at += rhythm[k % rhythm.length]
    })
  }
  // ── the "athlete" score's voices ──────────────────────────────────────────
  // spiccato strings: two detuned saws and a thin octave square through a filter that snaps shut, a touch of bow noise —
  // sixteenth after sixteenth, never rounded off
  function strings(t, f, vel, dur = 0.1) {
    log.push([t, f, vel])
    const g = mk.gain(0)
    const lp = mk.filter('lowpass', 1000 + 5600 * vel, 0.8)
    lp.frequency.setValueAtTime(1000 + 5600 * vel, t)
    lp.frequency.exponentialRampToValueAtTime(650, t + dur * 1.3)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.15 * vel, t + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05)
    for (const [type, det, mul, gv] of [
      ['sawtooth', -7, 1, 0.5],
      ['sawtooth', 7, 1, 0.5],
      ['square', 0, 2, 0.08],
    ]) {
      const o = mk.osc(type, f * mul)
      o.detune.value = det
      const og = mk.gain(gv)
      o.connect(og)
      og.connect(lp)
      o.start(t)
      o.stop(t + dur + 0.1)
    }
    lp.connect(g)
    g.connect(ep.m)
    const [s] = noise()
    const bp = mk.filter('bandpass', Math.min(7000, f * 3.2), 1.4)
    const bg = mk.gain(0)
    bg.gain.setValueAtTime(0.0001, t)
    bg.gain.linearRampToValueAtTime(0.03 * vel, t + 0.002)
    bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.03)
    s.connect(bp)
    bp.connect(bg)
    bg.connect(ep.m)
    s.start(t, rnd(0, 3))
    s.stop(t + 0.05)
  }
  // timpani: a round sine that falls from a fifth above, a second partial, a thump of felt
  function timp(t, f, vel) {
    const o = mk.osc('sine', f)
    o.frequency.setValueAtTime(f * 1.5, t)
    o.frequency.exponentialRampToValueAtTime(f, t + 0.06)
    const g = mk.gain(0)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.5 * vel, t + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.0)
    o.connect(g)
    g.connect(ep.p)
    o.start(t)
    o.stop(t + 1.05)
    const o2 = mk.osc('triangle', f * 1.51)
    const g2 = mk.gain(0)
    g2.gain.setValueAtTime(0.0001, t)
    g2.gain.linearRampToValueAtTime(0.16 * vel, t + 0.003)
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.45)
    o2.connect(g2)
    g2.connect(ep.p)
    o2.start(t)
    o2.stop(t + 0.5)
    const [s] = noise()
    const bp = mk.filter('bandpass', 260, 1.1)
    const ng = mk.gain(0)
    ng.gain.setValueAtTime(0.0001, t)
    ng.gain.linearRampToValueAtTime(0.12 * vel, t + 0.002)
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.07)
    s.connect(bp)
    bp.connect(ng)
    ng.connect(ep.p)
    s.start(t, rnd(0, 3))
    s.stop(t + 0.09)
  }
  // a brass swell: unison saws that open slowly from a hush to a roar, then are cut at the bar line
  function brassSwell(t, f, dur, vel) {
    log.push([t, f, vel])
    const g = mk.gain(0)
    const lp = mk.filter('lowpass', 380, 0.9)
    lp.frequency.setValueAtTime(380, t)
    lp.frequency.exponentialRampToValueAtTime(2400, t + dur)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.13 * vel, t + dur * 0.96)
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.06)
    for (const [type, det, gv] of [
      ['sawtooth', -9, 0.5],
      ['sawtooth', 9, 0.5],
      ['sawtooth', 1200 + 4, 0.2],
    ]) {
      const o = mk.osc(type, f)
      o.detune.value = det
      const og = mk.gain(gv)
      o.connect(og)
      og.connect(lp)
      o.start(t)
      o.stop(t + dur + 0.12)
    }
    lp.connect(g)
    g.connect(ep.d)
    live.push([g, t + dur + 0.2])
  }

  function grooveModern(t, n, step) {
    const s = n % 16
    const bar = Math.floor(n / 16)
    const cyc = bar % 8
    const p = state.level.pulse
    const d = state.level.drive
    const m = state.level.music
    const r = M.modern.bars[bar % M.modern.bars.length]
    const root = note(r - 7)
    const barLen = 16 * step

    if (s === 0) {
      mpad(t, chordIdx(r).map((i) => i), barLen + 1.8)
      // the phrase: a hook on its first bar (or the brass at the peak), a call on the third, one long
      // breath on the fifth, an answer on the seventh — and the arpeggio alone in between
      let brass = false
      if (cyc === 0 && d > 0.74 && Math.random() < 0.6) {
        fanfare(t, step)
        brass = true
      }
      if (cyc === 0 && bar > 0 && d > 0.35) impact(t, 0.35 + 0.65 * d)
      if (cyc === 4 && Math.random() < 0.85) air(t + step * 2, note(r + 14), barLen * 1.6, 0.5 + 0.4 * m)
      if ((cyc === 2 || cyc === 6 || (cyc === 0 && !brass)) && Math.random() < 0.5 + 0.45 * m) melody(t, r, step, 0.55 + 0.45 * m)
    }

    // kick (and the first teks of the maqsum) from the very first bar — calm at first, fuller as the crowd arrives
    if ((s === 0 || s === 8) && p > 0.03) kick(t, 0.5 + 0.5 * p)
    if (s === 10 && p > 0.4 && d > 0.4 && cyc % 2 === 1) kick(t, 0.45 + 0.3 * p)
    if ((s === 4 || s === 12) && p > 0.8 && d > 0.7) kick(t, 0.5)
    if ((s === 2 || s === 6 || s === 12) && p > 0.12) tak(t, 0.45 + 0.55 * p)
    if ((s === 4 || s === 10 || s === 14) && p > 0.3) ka(t, 0.4 + 0.5 * p)
    if ((s === 4 || s === 12) && d > 0.4) clap(t, 0.4 + 0.6 * d)
    if (d > 0.12) shaker(t, (s % 4 === 2 ? 1 : s % 2 === 1 ? 0.42 : 0.68) * (0.3 + 0.7 * d))

    // bass
    if (s === 0) bass(t, root, 6 * step, 0.95)
    if (s === 8 && p > 0.25) bass(t, root, 2.6 * step, 0.7)
    if (s === 11 && d > 0.3) bass(t, note(r - 3), 2.2 * step, 0.6)
    if (s === 14 && d > 0.55) bass(t, note(r), 1.8 * step, 0.5)

    // the plucked arpeggio, 3+3+2 over the bar; the second shape returns on the fifth bar of the phrase
    const shape = M.modern.arps[cyc < 4 ? 0 : 1]
    const hit = [0, 3, 6, 8, 11, 14].indexOf(s)
    if (hit >= 0) pluck(t, note(r + 7 + shape[hit]), (hit === 0 ? 0.85 : 0.5 + 0.12 * (hit % 3)) * (0.7 + 0.3 * m), 0.9)

    // the turn of the phrase: a tom roll and a riser on the last bar
    if (cyc === 7 && d > 0.6 && s >= 12) tom(t, [210, 172, 140, 108][s - 12], 0.6 + 0.3 * d)
    if (cyc === 7 && s === 8 && d > 0.3) riser(t, 8 * step, 0.4 + 0.6 * d)
  }

  // ── the stadium, second version: "modern desert" ────────────────────────────
  // One bar = 12 sixteenths in a rolling 6/8 (two beats of three eighths, 1.82 s); the chords change every
  // bar (I – ♭II – I – ♭VII in Hijaz) and eight bars make a phrase. A composed arc, not a loop:
  //   bars 1–2     the intro: a pad swelling over a sub-bass pedal, one pluck, then the cross-rhythm
  //   bar 3 on     the groove enters (kick, tak, claps, shaker) and grows with the scroll
  //   every phrase a hook, a call, a long breath and an answer from the bowed lead; riser / impact / tom roll
  //   the end      on the black logo screen the drums step back: pad, ostinato and one long note resolve
  //
  //   kick     x . . . . . x . . x . .       (the second beat; the syncopated one only when it is full)
  //   tak      . . . . t . . . t . . .       the dumbek of the 6/8: dum . tak dum tak
  //   claps    . . . . x . . . . . x .
  //   ostinato x . . x . . x . . x . .       four plucks against the two beats (3+3+3+3)
  function grooveDesert(t, n, step) {
    const s = n % 12
    const bar = Math.floor(n / 12)
    const cyc = bar % 8
    const p = state.level.pulse
    const d = state.level.drive
    const m = state.level.music
    const end = state.level.end
    const dr = bar < 2 ? 0 : 1 - clamp((end - 0.15) / 0.55, 0, 1) // how much of the drums is there
    const r = M.modern.bars[bar % M.modern.bars.length]
    const root = note(r === 6 ? r - 14 : r - 7)
    const barLen = 12 * step

    if (s === 0) {
      mpad(t, chordIdx(r), barLen + 2.2)
      let brass = false
      if (dr > 0.5 && cyc === 0 && d > 0.74 && Math.random() < 0.6) {
        fanfare(t, step)
        brass = true
      }
      if (dr > 0.5 && cyc === 0 && bar > 0 && d > 0.35) impact(t, 0.35 + 0.65 * d)
      if (end > 0.5) {
        // the ending: one long breath on a chord tone every second bar; a soft impact the first time
        if (!state.finalHit) {
          impact(t, 0.45)
          state.finalHit = true
        }
        if (bar % 2 === 0) air(t, note(nearestTone(r, 14)), barLen * 2.3, 0.75)
      } else {
        state.finalHit = false
        if (bar === 1) air(t + step * 3, note(14), barLen * 1.7, 0.45 + 0.3 * m) // the first breath of the intro
        if (bar >= 2 && cyc === 4 && Math.random() < 0.85) air(t + step * 2, note(r + 14), barLen * 1.7, 0.5 + 0.4 * m)
        if (bar >= 2 && (cyc === 2 || cyc === 6 || (cyc === 0 && !brass)) && Math.random() < 0.5 + 0.45 * m) melody(t, r, step, 0.55 + 0.45 * m)
      }
    }

    // the drums
    if (dr > 0.05) {
      if ((s === 0 || s === 6) && p > 0.03) kick(t, (0.5 + 0.5 * p) * dr)
      if (s === 9 && p > 0.45 && d > 0.5) kick(t, 0.4 * dr)
      if ((s === 4 || s === 8) && p > 0.12) tak(t, (0.45 + 0.55 * p) * dr)
      if ((s === 2 || s === 10) && p > 0.3) ka(t, (0.4 + 0.5 * p) * dr)
      if ((s === 4 || s === 10) && d > 0.4) clap(t, (0.4 + 0.6 * d) * dr)
      if (d > 0.12 && (s % 2 === 0 || d > 0.45)) shaker(t, (s % 6 === 0 ? 0.5 : s % 2 === 0 ? 0.9 : 0.38) * (0.3 + 0.7 * d) * dr)
    }

    // the sub-bass pedal: always the root of the bar's chord
    if (s === 0) bass(t, root, 5 * step, (bar === 0 ? 0.5 : 0.7) * (end > 0.5 ? 0.6 : 1))
    if (dr > 0.3 && s === 6 && p > 0.25) bass(t, root, 3 * step, 0.5)
    if (dr > 0.3 && s === 9 && d > 0.35) bass(t, note(r === 6 ? r - 10 : r - 3), 2.2 * step, 0.42)

    // the plucked cross-rhythm: sparse in the first bar, every note after it, only the beats at the end
    const k = [0, 3, 6, 9].indexOf(s)
    if (k >= 0) {
      const play = end > 0.5 ? k % 2 === 0 : bar === 0 ? k % 2 === 0 : true
      if (play) {
        const shape = M.modern.arps[Math.floor(cyc / 2) % M.modern.arps.length]
        pluck(t, note(r + 7 + shape[k]), (k === 0 ? 0.85 : 0.55 + 0.1 * (k % 2)) * (0.7 + 0.3 * m) * (end > 0.5 ? 0.7 : 1), 1)
      }
    }

    // the turn of the phrase
    if (dr > 0.5 && cyc === 7 && d > 0.6 && s >= 8) tom(t, [210, 172, 140, 108][s - 8], 0.6 + 0.3 * d)
    if (dr > 0.5 && cyc === 7 && s === 6 && d > 0.3) riser(t, 6 * step, 0.4 + 0.6 * d)
  }


  // ── the home journey, third version: "Odyssey" ──────────────────────────────
  // One bar = 16 sixteenths at 72 bpm (3.33 s, one oar stroke per beat); eight bars make a phrase on open fifths
  // over a deep D–A drone. The score follows the scroll, so it reads like a film cue rather than a loop:
  //   bars 1–2     the invocation, while the dust clears: a deep bronze, the drone, one lyre call (A D G A · F E½♭ D)
  //   bar 3 on     an aulos line answers; a long breath on the sixth bar; calls of the lyre while it is still quiet
  //   pulse > .22  a frame drum beats like oars (beats 1 and 3) and the lyre's 3+3+4+3+3 cell enters
  //   drive > .3   wood and bronze ticks on the off-beats, a gong on each new phrase
  //   drive > .55  ghost strokes, a roll and a rising swell at the turn of the phrase, low steps under the F and G bars
  //   the end      on the black screen the oars rest: a last bronze, a long breath on D, the lyre alone
  //
  //   frame drum  x . . . . . . . x . . . . . . .        wood / bronze   . . . x . . x . . . x . . x . .
  //   lyre cell   x . . x . . x . . . x . . x . .        (3 + 3 + 4 + 3 + 3)
  function lyreCall(t0, call, step, vel) {
    call.forEach(([off, idx], k) => {
      const last = k === call.length - 1
      lyre(t0 + off * step, note(idx), vel * (last ? 0.9 : 0.75 + 0.25 * (k % 2)), last ? 4.5 : 2.6)
    })
  }
  function aulosLine(t0, line, step, vel) {
    line.forEach(([off, idx, len], k) => {
      const last = k === line.length - 1
      aulos(t0 + off * step, note(idx), len * step * 0.95, vel * (last ? 0.85 : 0.95), k === 0 ? 0 : pick([0, 0, 100]))
    })
  }
  function grooveOdyssey(t, n, step) {
    const X = M.modern
    const s = n % 16
    const bar = Math.floor(n / 16)
    const cyc = bar % 8
    const p = state.level.pulse
    const d = state.level.drive
    const m = state.level.music
    const end = state.level.end
    const dr = bar < 2 ? 0 : 1 - clamp((end - 0.15) / 0.55, 0, 1) // how much of the percussion is there
    const r = end > 0.5 ? 0 : X.bars[cyc]
    const barLen = 16 * step

    if (s === 0) {
      opad(t, [r, r + 4, r + 7], barLen * 1.8, end > 0.5 ? 0.8 : 0.75 + 0.9 * d) // the pad grows with the drive
      if (bar === 0) bronze(t + 0.05, note(0), 0.6, 8) // the first strike
      if (end > 0.5) {
        // the resolution: one last bronze, then a long breath on D every second bar
        if (!state.finalHit) {
          bronze(t, note(0), 0.85, 9)
          state.finalHit = true
        }
        if (bar % 2 === 0) air(t + step, note(7), barLen * 2.3, 0.7)
      } else {
        state.finalHit = false
        if (dr > 0.5 && cyc === 0 && bar > 0 && d > 0.3) bronze(t, note(0), 0.45 + 0.5 * d, 6.5)
        if (dr > 0.5 && cyc === 4 && d > 0.6) bronze(t, note(3), 0.4 + 0.35 * d, 5)
        if (bar >= 2 && (cyc === 2 || cyc === 6) && (bar === 2 || Math.random() < 0.55 + 0.4 * m)) {
          aulosLine(t, pick(X.lines), step, 0.6 + 0.4 * m)
        }
        if (cyc === 5 && Math.random() < 0.8) air(t + 3 * step, note(r + 11), barLen * 1.5, 0.45 + 0.4 * m)
        if (r !== 0 && d > 0.4 && dr > 0.3) bass(t, note(r - 7), 9 * step, 0.5) // low steps under the F and G bars
      }
    }
    // the lyre calls to the empty desert while the pulse is still asleep
    if (end <= 0.5) {
      if (bar === 0 && s === 4) {
        state.lastCall = 0
        lyreCall(t, X.calls[0], step, 0.75)
      } else if (bar >= 8 && cyc === 0 && s === 6 && p < 0.5) {
        let k
        do k = (Math.random() * X.calls.length) | 0
        while (k === state.lastCall && X.calls.length > 1)
        state.lastCall = k
        lyreCall(t, X.calls[k], step, 0.55 + 0.3 * m)
      }
    } else if (bar % 2 === 0 && (s === 0 || s === 8)) {
      lyre(t, note(s === 0 ? 7 : 11), s === 0 ? 0.55 : 0.4, 4) // the lyre alone: D, then A
    }

    // the oars
    if (dr > 0.05) {
      if ((s === 0 || s === 8) && p > 0.22) frame(t, (0.42 + 0.58 * p) * (0.85 + 0.4 * d) * dr * (s === 0 ? 1 : 0.8), s === 0 ? 1 : 0.7)
      if (s === 6 && p > 0.5 && d > 0.3) frame(t, 0.38 * dr, 0.6)
      if (s === 11 && d > 0.55) frame(t, 0.46 * dr, 0.7)
      if (s === 14 && d > 0.75) frame(t, 0.4 * dr, 0.7)
      if ((s === 3 || s === 10) && d > 0.3) wood(t, (0.4 + 0.6 * d) * dr, s === 10)
      if ((s === 6 || s === 13) && d > 0.5) shield(t, (0.4 + 0.6 * d) * dr)
      if (d > 0.78 && (s === 2 || s === 15)) wood(t, 0.4 * dr, true)
    }

    // the lyre's cell: five plucks on the open fifths of the bar's chord
    if (bar >= 2 && p > 0.22) {
      const k = [0, 3, 6, 10, 13].indexOf(s)
      if (k >= 0) {
        const cell = X.cell[X.cellOf[cyc]]
        const v = (k === 0 ? 0.85 : 0.5 + 0.12 * (k % 2)) * (0.45 + 0.5 * p) * (0.7 + 0.3 * m)
        if (end > 0.5) {
          if (k === 0 && bar % 2 === 1) lyre(t, note(r + cell[k]), v * 0.6, 3)
        } else lyre(t, note(r + cell[k]), v, 1.8)
      }
    }

    // the turn of the phrase: a swell, then a roll of the frame drum into the next gong
    if (dr > 0.5 && cyc === 7 && d > 0.4 && s === 4) riser(t, 8 * step, 0.3 + 0.35 * d)
    if (dr > 0.5 && cyc === 7 && d > 0.55 && s >= 10 && s !== 11) frame(t, (0.3 + 0.07 * (s - 10)) * (0.6 + 0.4 * d) * dr, 1)
  }


  // ── the stadium, third version: "athlete" ───────────────────────────────────
  // One bar = 16 sixteenths at 144 bpm (6.7 s per 8 bars… ~13.3 s a phrase). The score is a pressure gauge driven by the scroll:
  //   always        the D pedal in the bass and the sixteenth-note string ostinato — soft and hushed at the top, tight and
  //                 doubled in octaves as the drive rises
  //   bar 3 on      timpani on the downbeat, a clock-like tick on the off-eighths
  //   drive > .25   a pad under it; kick and hand-claps on the backbeat past .55; a shaker in sixteenths past .45
  //   bars 5–7      the climb: a rising ostinato, a brass swell over three bars, a riser, a timpani roll on the last bar
  //   bar 1 (again) an impact and the theme on the horns when the drive is high
  //   the end       on the black screen the ostinato stops mid-phrase: one huge impact, a held low brass, a lone high string
  //
  //   timpani   x . . . . . . . x . . . . . . .      (and on every beat once it is tense)
  //   tick      . . x . . . x . . . x . . . x .
  //   claps     . . . . x . . . . . . . x . . .
  function grooveAthlete(t, n, step) {
    const X = M.modern
    const s = n % 16
    const bar = Math.floor(n / 16)
    const cyc = bar % 8
    const p = state.level.pulse
    const d = state.level.drive
    const m = state.level.music
    const end = state.level.end
    const dr = bar < 2 ? 0 : 1 - clamp((end - 0.15) / 0.55, 0, 1) // how much of the percussion is there
    const st = 1 - clamp(end / 0.5, 0, 1) // the strings stop as the end arrives
    const r = end > 0.5 ? 0 : X.bars[cyc]
    const barLen = 16 * step

    if (s === 0) {
      // the pedal and the pad
      if (end <= 0.5) {
        bass(t, note(-7), barLen * 0.97, (0.45 + 0.45 * d) * (bar === 0 ? 0.8 : 1))
        if (d > 0.25) mpad(t, [r + 7, r + 9, r + 11], barLen + 0.6)
        if (d > 0.4 && r !== 0 && cyc !== 0) bass(t, note(r - 7), barLen * 0.5, 0.35 + 0.3 * d) // the chord's own root, under the pedal
      }
      if (end > 0.5) {
        // the ending: one huge impact, a low brass held, a lone high string every second bar
        if (!state.finalHit) {
          impact(t, 0.95)
          timp(t, note(-7), 1)
          brassSwell(t + 0.02, note(-7), barLen * 1.6, 0.55)
          state.finalHit = true
        }
        if (bar % 2 === 0) air(t + step * 2, note(11), barLen * 2.2, 0.6)
      } else {
        state.finalHit = false
        if (dr > 0.5 && cyc === 0 && bar > 0 && d > 0.35) {
          impact(t, 0.35 + 0.6 * d)
          if (d > 0.6 && Math.random() < 0.75) fanfare(t, step)
        }
        if (dr > 0.5 && cyc === 4 && d > 0.4) brassSwell(t, note(-7), barLen * 3, 0.35 + 0.65 * d) // the swell climbs for three bars
        if (cyc === 2 && d > 0.3 && Math.random() < 0.6) air(t + 2 * step, note(r + 14), barLen * 1.5, 0.35 + 0.4 * m)
      }
    }

    // the ostinato: sixteenths, accented on the beat; octave doubling at the top of the drive
    if (st > 0.03 && !(bar === 0 && s < 2)) {
      const shape = X.cells[cyc < 4 ? (d > 0.8 && cyc % 2 === 1 ? 2 : 0) : cyc < 7 ? 1 : 2]
      const acc = [1, 0.5, 0.72, 0.5][s % 4]
      const climb = 0.82 + 0.18 * (cyc / 7)
      const vel = (0.2 + 0.8 * d) * (0.55 + 0.45 * m) * acc * climb * st
      strings(t, note(r + 7 + shape[s]), vel, step * 0.95)
      if (d > 0.5 && (s % 4 === 0 || d > 0.8)) strings(t, note(r + 14 + shape[s]), vel * 0.5, step * 0.9)
    }

    // the percussion
    if (dr > 0.05) {
      if (s === 0 && p > 0.3) timp(t, note(-7) * 1.5, (0.4 + 0.6 * d) * dr)
      if (s === 8 && p > 0.45) timp(t, note(-7) * 1.5, (0.3 + 0.55 * d) * dr)
      if ((s === 4 || s === 12) && d > 0.55) timp(t, note(-7) * 1.26, (0.3 + 0.4 * d) * dr)
      if (s === 14 && d > 0.85) timp(t, note(-7) * 1.5, 0.45 * dr)
      if ((s === 0 || s === 8) && d > 0.45) kick(t, (0.4 + 0.5 * d) * dr)
      if ((s === 2 || s === 6 || s === 10 || s === 14) && d > 0.22) tak(t, (0.25 + 0.55 * d) * dr)
      if ((s === 4 || s === 12) && d > 0.58) clap(t, (0.35 + 0.65 * d) * dr)
      if (d > 0.45) shaker(t, (s % 4 === 2 ? 1 : 0.45) * (0.3 + 0.7 * d) * dr)
    }

    // the last bar of the phrase: a riser, then a roll of the timpani into the next downbeat
    if (dr > 0.5 && cyc === 7 && d > 0.35 && s === 4) riser(t, 12 * step, 0.35 + 0.5 * d)
    if (dr > 0.5 && cyc === 7 && d > 0.5 && s >= 8) timp(t, note(-7) * (s >= 12 ? 1.5 : 1.26), (0.22 + 0.04 * (s - 8)) * (0.6 + 0.4 * d) * dr)
  }

  function scheduleUntil(horizon) {
    if (!M.modern) scheduleFreeRhythm(horizon)
    else {
      const step = 60 / M.sport.bpm / 4
      const groove = { desert: grooveDesert, odyssey: grooveOdyssey, athlete: grooveAthlete }[M.modern.kind] || grooveModern
      while (state.nextStep < horizon) groove(state.nextStep, state.stepN++, step), (state.nextStep += step)
    }
    const rate = 3 + 55 * state.level.wind
    while (state.nextGrain < horizon) {
      if (state.level.wind > 0.02 && !M.noGrain) grain(state.nextGrain)
      state.nextGrain += -Math.log(1 - Math.random()) / rate
    }
  }

  // the home page and the harbour: free-rhythm phrases over a drone, and a slow drum
  function scheduleFreeRhythm(horizon) {
    while (state.nextPad < horizon) {
      const dur = 26
      pad(state.nextPad, M.chords[state.padN++ % M.chords.length], dur)
      state.nextPad += dur - 6
    }
    while (state.nextPhrase < horizon) {
      const end = phrase(state.nextPhrase)
      const restScale = 1 + (1 - state.level.music) * 1.1
      state.nextPhrase = end + rnd(M.gap[0], M.gap[1]) * restScale
    }
    while (state.nextNey < horizon) {
      const dur = rnd(5, 9)
      ney(state.nextNey, note(pick(M.ney)), dur, rnd(0.5, 0.75))
      state.nextNey += dur + rnd(9, 15) * (1 + (1 - state.level.music))
    }
    // a slow maqsum-like pattern (one bar = eight steps of 0.46 s); silent unless the scene asks for it
    const STEP = 0.46
    const PATTERN = ['D', 't', '-', 't', 'D', '-', 't', '-']
    while (state.nextBeat < horizon) {
      const hit = PATTERN[state.beatN++ % 8]
      const p = state.level.pulse
      if (p > 0.03 && hit !== '-') {
        if (hit === 'D') doum(state.nextBeat, 0.55 + 0.45 * p)
        else tek(state.nextBeat, 0.4 + 0.6 * p)
      }
      state.nextBeat += STEP
    }
  }

  // ── controls ─────────────────────────────────────────────────────────────
  function setScene({ wind, music, clarity, pulse, crowd, drive, rain, end }, immediate = false) {
    const t = ctx.currentTime
    if (wind != null) state.level.wind = wind
    if (music != null) state.level.music = music
    if (clarity != null) state.level.clarity = clarity
    if (pulse != null) state.level.pulse = pulse
    if (crowd != null) state.level.crowd = crowd
    if (drive != null) state.level.drive = drive
    if (rain != null) state.level.rain = rain
    if (end != null) state.level.end = end // 1 on the black logo screen: the music resolves
    const set = (param, v, tc) => (immediate ? (param.value = v) : param.setTargetAtTime(v, t, tc))
    set(windMaster.gain, 0.6 * state.level.wind, 0.5)
    set(musicBus.gain, 0.95 * state.level.music, 0.8)
    set(pulseBus.gain, 0.8 * state.level.pulse, 0.6)
    set(crowdBus.gain, 0.85 * state.level.crowd, 1.2)
    set(driveBus.gain, 0.9, 0.3)
    set(rainBus.gain, 0.33 * state.level.rain, 1.4)
    set(lpf.frequency, 900 + 8100 * Math.pow(state.level.clarity, 1.5), 0.6)
    if (M.drone) set(droneTrim.gain, M.drone * (0.85 + 0.55 * state.level.drive * (1 - state.level.end)), 1.5) // the drone swells with the journey
  }
  let soundOn = false
  const masterLevel = () => (soundOn ? 0.55 * (M.trim ?? 1) : 0)
  function setEnabled(on, immediate = false) {
    const t = ctx.currentTime
    soundOn = on
    if (immediate) master.gain.value = masterLevel()
    else master.gain.setTargetAtTime(masterLevel(), t, on ? 0.6 : 0.15)
  }
  function resumeClock() {
    const t = ctx.currentTime + 0.1
    state.nextPhrase = Math.max(state.nextPhrase, t + 0.6)
    state.nextNey = Math.max(state.nextNey, t + 5)
    state.nextPad = Math.max(state.nextPad, t)
    state.nextGrain = Math.max(state.nextGrain, t)
    state.nextBeat = Math.max(state.nextBeat, t + 0.2)
    state.nextStep = Math.max(state.nextStep, t + 0.2)
  }

  // Switch the whole piece to another mood: the old epoch's gates close at once (notes already
  // scheduled ahead included), the reverb tail is ducked until it has died, the drone retunes while
  // nothing can be heard, and the new epoch fades in with a phrase composed in the new maqam.
  let moodKey = MOODS[moodName] ? moodName : 'malwiya'
  function setMood(name) {
    const next = MOODS[name]
    if (!next || next === M) return
    M = next
    moodKey = name
    const t = ctx.currentTime
    if (soundOn) master.gain.setTargetAtTime(masterLevel(), t, 0.5)
    const old = ep
    for (const g of [old.m, old.p, old.d, old.c]) {
      g.gain.cancelScheduledValues(t)
      g.gain.setTargetAtTime(0, t, 0.09)
    }
    // the old gates are dead weight once their notes are over
    if (typeof setTimeout === 'function' && !(ctx instanceof OfflineAudioContext)) {
      setTimeout(() => {
        for (const g of [old.m, old.p, old.d, old.c]) {
          try {
            g.disconnect()
          } catch (e) {
            /* already gone */
          }
        }
      }, 20000)
    }
    ep = makeEpoch(false)
    droneTrim.disconnect()
    droneTrim.connect(ep.m)
    droneTrim.gain.cancelScheduledValues(t)
    droneTrim.gain.setValueAtTime(droneLevel(), t + 0.2)
    for (const g of [ep.m, ep.p, ep.d, ep.c]) {
      g.gain.setValueAtTime(0, t)
      g.gain.setTargetAtTime(1, t + 0.55, 0.4)
    }
    reverbWet.gain.cancelScheduledValues(t)
    reverbWet.gain.setTargetAtTime(0, t, 0.1)
    reverbWet.gain.setTargetAtTime(0.85, t + 2.6, 0.9)
    live.length = 0
    for (const [o, fn] of droneVoices) o.frequency.setValueAtTime(fn(), t + 0.4)
    // levels belong to the place that set them
    state.level.pulse = 0
    state.level.crowd = 0
    state.level.drive = 0
    state.level.end = 0
    state.finalHit = false
    state.lastCall = -1
    state.idx = M.startIdx
    state.padN = 0
    state.nextPad = t + 0.9
    state.nextPhrase = t + 2.4
    state.nextNey = Math.max(t + 9, state.nextNey)
    state.nextBeat = t + 0.6
    state.nextStep = t + 0.7
    state.stepN = 0
    state.beatN = 0
  }
  const moodName0 = () => moodKey

  return { scheduleUntil, setScene, setEnabled, resumeClock, setMood, cheer, mood: moodName0, state, log }
}

// ═════════════════════════════════════════════════════════════════════════════
//  Real-time wrapper + UI state
// ═════════════════════════════════════════════════════════════════════════════
let ctx = null
let engine = null
let timer = 0
let snapshot = { on: false, ready: false }
let pendingScene = { wind: 0, music: 0.4, clarity: 1, pulse: 0, crowd: 0, drive: 0, rain: 0 }
let pendingMood = 'malwiya'
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

const isTouch = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
// Phones get a longer look-ahead: while the 3D scene is busy a timer can be late by a second or more.
const lookAhead = () => (isTouch() ? 3.8 : 2.2)

// iPhones send Web Audio to the "ringer" channel, which the side switch mutes — the usual reason
// a site is silent on a phone while the sound button says "on". Declaring a 'playback' audio
// session (iOS 16.4+), and keeping a silent <audio> element playing for older iOS, moves the music
// to the media channel, which is heard like the sound of any video. Called inside the click.
let keepAlive = null
let silentSrc = ''
function silence() {
  if (silentSrc) return silentSrc
  const n = 4000 // 0.5 s of 8-bit mono silence at 8 kHz
  const b = new Uint8Array(44 + n)
  const w = (o, str) => [...str].forEach((c, i) => (b[o + i] = c.charCodeAt(0)))
  const u32 = (o, v) => [0, 1, 2, 3].forEach((i) => (b[o + i] = (v >>> (8 * i)) & 255))
  const u16 = (o, v) => [0, 1].forEach((i) => (b[o + i] = (v >>> (8 * i)) & 255))
  w(0, 'RIFF')
  u32(4, 36 + n)
  w(8, 'WAVEfmt ')
  u32(16, 16)
  u16(20, 1)
  u16(22, 1)
  u32(24, 8000)
  u32(28, 8000)
  u16(32, 1)
  u16(34, 8)
  w(36, 'data')
  u32(40, n)
  b.fill(128, 44)
  let bin = ''
  b.forEach((v) => (bin += String.fromCharCode(v)))
  silentSrc = 'data:audio/wav;base64,' + btoa(bin)
  return silentSrc
}
function mediaChannel(on) {
  try {
    if (navigator.audioSession) navigator.audioSession.type = on ? 'playback' : 'auto'
  } catch (e) {
    /* not supported */
  }
  try {
    if (on) {
      if (!keepAlive) {
        keepAlive = document.createElement('audio')
        keepAlive.setAttribute('playsinline', '')
        keepAlive.setAttribute('aria-hidden', 'true')
        keepAlive.loop = true
        keepAlive.preload = 'auto'
        keepAlive.src = silence()
      }
      const p = keepAlive.play()
      if (p && p.catch) p.catch(() => {})
    } else if (keepAlive) {
      keepAlive.pause()
    }
  } catch (e) {
    /* autoplay refused: the Web Audio context still plays on devices without a ringer switch */
  }
}

function ensure() {
  if (ctx) return true
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)
  if (!AC) return false
  try {
    ctx = isTouch() ? new AC({ latencyHint: 'playback' }) : new AC()
  } catch (e) {
    ctx = new AC()
  }
  // the classic unlock: one silent sample played inside the gesture
  try {
    const s = ctx.createBufferSource()
    s.buffer = ctx.createBuffer(1, 1, 22050)
    s.connect(ctx.destination)
    s.start(0)
  } catch (e) {
    /* ignore */
  }
  engine = createEngine(ctx, pendingMood)
  engine.setScene(pendingScene, true)
  return true
}
function pump() {
  engine.scheduleUntil(ctx.currentTime + lookAhead())
}

export const audio = {
  // Must be called from a user gesture (click / key) — browsers refuse audio before.
  async enable() {
    mediaChannel(true) // first, synchronously, while the tap still counts as a user gesture
    if (!ensure()) return false
    try {
      // On some phones resume() never settles until a later tap: do not wait for it forever.
      await Promise.race([ctx.resume(), new Promise((r) => setTimeout(r, 700))])
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
    mediaChannel(false)
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
  // Night mode: the rain layer (0 = dry, 1 = steady rain). Independent of the scene's wind and music.
  setRain(v) {
    pendingScene = { ...pendingScene, rain: v }
    if (engine) engine.setScene({ rain: v })
  },
  // The stands erupt (whistle + roar): the stadium journey calls this as the bowl fills.
  cheer() {
    if (engine && snapshot.on) engine.cheer()
  },
  // Which piece is playing: 'malwiya' (Bayati) or 'stadium' (Rast + drum). Safe to call any time.
  setMood(name) {
    pendingMood = name
    pendingScene = { ...pendingScene, end: 0 } // a new place never starts on the ending of the last one
    if (engine) engine.setMood(name)
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
    if (document.hidden) {
      ctx.suspend().catch(() => {})
      if (keepAlive) keepAlive.pause()
    } else {
      ctx.resume().catch(() => {})
      if (keepAlive) keepAlive.play().catch(() => {})
    }
  })
  // Phones suspend ("interrupted") the audio after a call, a lock screen or a long scroll: the next
  // touch brings the music back instead of leaving a button that says "on" over silence.
  const reawaken = () => {
    if (!ctx || !snapshot.on || document.hidden) return
    if (ctx.state !== 'running') ctx.resume().catch(() => {})
    if (keepAlive && keepAlive.paused) keepAlive.play().catch(() => {})
  }
  ;['pointerdown', 'touchend', 'keydown'].forEach((t) => window.addEventListener(t, reawaken, { capture: true, passive: true }))
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

// The home journey plays the "Odyssey" score; ?music=classic brings back the first (free-rhythm Bayati) one.
export const homeMood = () => (typeof location !== 'undefined' && /[?&]music=classic\b/.test(location.search) ? 'malwiya' : 'odyssey')

// Offline render, used only for verification (?debug).
export async function renderOffline(seconds = 30, scene = { wind: 0, music: 1, clarity: 1 }, mood = 'malwiya', opts = {}) {
  const oc = new OfflineAudioContext(2, 44100 * seconds, 44100)
  const e = createEngine(oc, mood)
  e.setScene(scene, true)
  e.setEnabled(true, true)
  if (opts.cheer) e.cheer()
  e.scheduleUntil(seconds)
  const buffer = await oc.startRendering()
  return { buffer, log: e.log }
}

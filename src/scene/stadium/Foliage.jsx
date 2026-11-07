import { useMemo } from 'react'
import { BufferAttribute, BufferGeometry, DoubleSide, InstancedMesh, MeshStandardMaterial, Object3D } from 'three'
import { SU } from './materials'
import { samplePath } from './path'
import PALMS from './palms.json'

// ─────────────────────────────────────────────────────────────────────────────
//  DATE PALMS (Phoenix dactylifera) — the planting along the river and the paths.
//  Each palm is built the way the tree grows: a straight, slightly leaning trunk marked
//  with the diamond scars of cut frond bases and thickened into a fibrous collar at the
//  crown; ~45 pinnate fronds in four tiers (young ones upright, old ones hanging), each a
//  curved midrib carrying two ranks of stiff, V-folded leaflets that shorten towards the
//  tip; and bunches of dates hanging in orange-brown strands under the crown.
//  Three levels of detail, chosen by how close the camera's own path comes to each tree,
//  and three variants of each so no two neighbours are twins. Everything is instanced.
// ─────────────────────────────────────────────────────────────────────────────

function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

class Builder {
  constructor() {
    this.p = []
    this.c = []
    this.i = []
  }
  v(x, y, z, col) {
    this.p.push(x, y, z)
    this.c.push(col[0], col[1], col[2])
    return this.p.length / 3 - 1
  }
  tri(a, b, c) {
    this.i.push(a, b, c)
  }
  geometry() {
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(this.p), 3))
    g.setAttribute('color', new BufferAttribute(new Float32Array(this.c), 3))
    g.setIndex(this.i)
    return g
  }
}

const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k]
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

// the three levels of detail
const LOD = [
  { sides: 12, rings: 22, fronds: 46, step: 0.17, leaf: 1, dates: 5, strands: 7 },
  { sides: 7, rings: 8, fronds: 30, step: 0.34, leaf: 1.7, dates: 3, strands: 4 },
  { sides: 5, rings: 4, fronds: 14, step: 0, leaf: 0, dates: 0, strands: 0 },
]

const TRUNK = [0.3, 0.22, 0.155]
const SCAR = [0.17, 0.12, 0.085]
const COLLAR = [0.2, 0.12, 0.07]
const LEAF = [0.2, 0.3, 0.17] // grey-green
const LEAF_TIP = [0.38, 0.45, 0.25]
const RACHIS = [0.33, 0.3, 0.17]
const DATE_A = [0.55, 0.2, 0.05]
const DATE_B = [0.34, 0.11, 0.035]

// one frond: a curved midrib with two ranks of leaflets
function frond(b, o, az, el, droop, L, tone, lod, rand) {
  const dx = Math.cos(az)
  const dz = Math.sin(az)
  const sx = -dz
  const sz = dx
  const N = lod.leaf ? 12 : 6
  // midrib path in the (outward, up) plane: the angle falls off along its length so it arches
  const path = []
  let r = 0
  let y = 0
  for (let k = 0; k <= N; k++) {
    const t = k / N
    path.push([r, y, t])
    const ang = el - droop * Math.pow(t, 1.35)
    r += Math.cos(ang) * (L / N)
    y += Math.sin(ang) * (L / N)
  }
  const at = (k) => [o[0] + dx * path[k][0], o[1] + path[k][1], o[2] + dz * path[k][0]]
  const tangent = (k) => {
    const a = path[Math.max(0, k - 1)]
    const c = path[Math.min(N, k + 1)]
    const tr = c[0] - a[0]
    const ty = c[1] - a[1]
    const l = Math.hypot(tr, ty) || 1
    return [(dx * tr) / l, ty / l, (dz * tr) / l]
  }

  if (!lod.leaf) {
    // far away: a feathered ribbon, widest about a third of the way out
    const row = []
    for (let k = 0; k <= N; k++) {
      const t = path[k][2]
      const w = L * (0.02 + 0.22 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.02)), 0.75)) * 0.5
      const p = at(k)
      const col = mixc(mul(LEAF, tone), LEAF_TIP, t * 0.8)
      row.push([b.v(p[0] + sx * w, p[1] - 0.12 * w, p[2] + sz * w, col), b.v(p[0], p[1] + 0.1, p[2], mul(col, 1.1)), b.v(p[0] - sx * w, p[1] - 0.12 * w, p[2] - sz * w, col)])
    }
    for (let k = 0; k < N; k++) {
      const [a0, a1, a2] = row[k]
      const [b0, b1, b2] = row[k + 1]
      b.tri(a0, a1, b0)
      b.tri(a1, b1, b0)
      b.tri(a1, a2, b1)
      b.tri(a2, b2, b1)
    }
    return
  }

  // the rib itself (a thin keeled strip, brown-green, with the spiny petiole at the base)
  const rib = []
  for (let k = 0; k <= N; k++) {
    const t = path[k][2]
    const w = 0.05 * (1 - 0.8 * t) + 0.01
    const p = at(k)
    const col = mixc(RACHIS, mul(LEAF, tone), Math.min(1, t * 1.6))
    rib.push([b.v(p[0] + sx * w, p[1], p[2] + sz * w, col), b.v(p[0] - sx * w, p[1], p[2] - sz * w, col)])
  }
  for (let k = 0; k < N; k++) {
    b.tri(rib[k][0], rib[k][1], rib[k + 1][0])
    b.tri(rib[k][1], rib[k + 1][1], rib[k + 1][0])
  }

  // leaflets: stiff blades set in pairs, folded up into a V, swept forward, longest at about 40 %
  const t0 = 0.2
  const t1 = 0.985
  const count = Math.max(6, Math.floor((L * (t1 - t0)) / lod.step))
  const Vang = 0.62 // fold of each blade above the midrib's plane
  for (let n = 0; n < count; n++) {
    const t = t0 + ((t1 - t0) * (n + 0.5)) / count
    const kf = t * N
    const k0 = Math.min(N - 1, Math.floor(kf))
    const f = kf - k0
    const pa = at(k0)
    const pb = at(k0 + 1)
    const P = [pa[0] + (pb[0] - pa[0]) * f, pa[1] + (pb[1] - pa[1]) * f, pa[2] + (pb[2] - pa[2]) * f]
    const T = tangent(k0)
    const prof = Math.pow(Math.sin(Math.PI * Math.min(1, 0.12 + 0.88 * ((t - t0) / (1 - t0)) * 0.95 + 0.0)), 0.8)
    const len = (0.28 + 0.62 * prof) * (0.92 + 0.16 * rand()) * lod.leaf * Math.min(1.35, L / 4.8)
    const wid = 0.035 * lod.leaf * (0.9 + 0.2 * rand())
    // an up vector perpendicular to the midrib
    const Up = [-T[0] * T[1], 1 - T[1] * T[1], -T[2] * T[1]]
    const ul = Math.hypot(Up[0], Up[1], Up[2]) || 1
    const U3 = [Up[0] / ul, Up[1] / ul, Up[2] / ul]
    for (let side = -1; side <= 1; side += 2) {
      const sv = [sx * side, 0, sz * side]
      const cv = Math.cos(Vang)
      const sn = Math.sin(Vang)
      const fwd = 0.5
      const d = [
        sv[0] * cv + U3[0] * sn + T[0] * fwd,
        sv[1] * cv + U3[1] * sn + T[1] * fwd,
        sv[2] * cv + U3[2] * sn + T[2] * fwd,
      ]
      const dl = Math.hypot(d[0], d[1], d[2])
      const droopy = 0.16 + 0.22 * t // the blade bows over at the tip
      const tip = [P[0] + (d[0] / dl) * len, P[1] + (d[1] / dl) * len - droopy * len, P[2] + (d[2] / dl) * len]
      const tone2 = tone * (0.9 + 0.2 * rand())
      const cb = mul(LEAF, tone2)
      const ct = mixc(cb, LEAF_TIP, 0.55 + 0.3 * rand())
      const a = b.v(P[0] - T[0] * wid, P[1] - T[1] * wid, P[2] - T[2] * wid, cb)
      const c = b.v(P[0] + T[0] * wid, P[1] + T[1] * wid, P[2] + T[2] * wid, cb)
      const e = b.v(tip[0], tip[1], tip[2], ct)
      b.tri(a, c, e)
    }
  }
}

// a bunch of dates: an arching stalk with hanging strands
function dateBunch(b, o, az, lod, rand) {
  const dx = Math.cos(az)
  const dz = Math.sin(az)
  const sx = -dz
  const sz = dx
  const stalk = []
  const K = 4
  for (let k = 0; k <= K; k++) {
    const t = k / K
    stalk.push([o[0] + dx * (0.2 + 1.35 * t), o[1] - 0.2 - 1.55 * t * t - 0.25 * t, o[2] + dz * (0.2 + 1.35 * t)])
  }
  const prev = []
  for (let k = 0; k <= K; k++) {
    const w = 0.035 * (1 - 0.5 * (k / K))
    const p = stalk[k]
    prev.push([b.v(p[0] + sx * w, p[1], p[2] + sz * w, RACHIS), b.v(p[0] - sx * w, p[1], p[2] - sz * w, RACHIS)])
  }
  for (let k = 0; k < K; k++) {
    b.tri(prev[k][0], prev[k][1], prev[k + 1][0])
    b.tri(prev[k][1], prev[k + 1][1], prev[k + 1][0])
  }
  const S = lod.strands
  for (let s = 0; s < S; s++) {
    const t = 0.28 + 0.7 * (s / (S - 1 || 1))
    const k = Math.min(K - 1, Math.floor(t * K))
    const f = t * K - k
    const p0 = stalk[k]
    const p1 = stalk[k + 1]
    const P = [p0[0] + (p1[0] - p0[0]) * f, p0[1] + (p1[1] - p0[1]) * f, p0[2] + (p1[2] - p0[2]) * f]
    const side = (s % 2 ? 1 : -1) * (0.05 + 0.05 * rand())
    const len = 0.55 + 0.35 * rand()
    const top = [P[0] + sx * side, P[1], P[2] + sz * side]
    const wd = 0.075
    const mid = 0.45
    const q = b.v(top[0], top[1], top[2], DATE_B)
    const m0 = b.v(top[0] + sx * wd, top[1] - len * mid, top[2] + sz * wd, DATE_A)
    const m1 = b.v(top[0] - sx * wd, top[1] - len * mid, top[2] - sz * wd, DATE_A)
    const m2 = b.v(top[0] + dx * wd, top[1] - len * mid, top[2] + dz * wd, mul(DATE_A, 0.9))
    const m3 = b.v(top[0] - dx * wd, top[1] - len * mid, top[2] - dz * wd, mul(DATE_A, 0.8))
    const e = b.v(top[0], top[1] - len, top[2], DATE_B)
    ;[[m0, m2], [m2, m1], [m1, m3], [m3, m0]].forEach(([u, w]) => {
      b.tri(q, u, w)
      b.tri(e, w, u)
    })
  }
}

function palmGeometry(level, seed) {
  const lod = LOD[level]
  const rand = rng(seed)
  const b = new Builder()
  const H = 12.5
  const leanAz = rand() * Math.PI * 2
  const lean = 0.5 + rand() * 1.1
  const wob = (rand() - 0.5) * 0.7
  const trunkAt = (t) => {
    const off = lean * t * t + wob * Math.sin(t * Math.PI * 1.5) * t
    return [Math.cos(leanAz) * off, t * H, Math.sin(leanAz) * off]
  }

  // trunk: tapering, a swollen foot and a fibrous collar, scarred in staggered diamonds
  const n = lod.sides
  const R = lod.rings
  const rings = []
  for (let k = 0; k <= R; k++) {
    const t = k / R
    const c = trunkAt(t)
    const foot = 1 + 0.55 * Math.exp(-t * 36)
    const collar = 1 + 0.32 * Math.pow(Math.max(0, (t - 0.84) / 0.16), 1.4)
    const r0 = (0.44 - 0.1 * t) * foot * collar
    const ring = []
    for (let s = 0; s < n; s++) {
      const a = ((s + (k % 2) * 0.5) / n) * Math.PI * 2
      const scar = lod.rings > 8 ? ((k + s) % 2 ? 1 : 0) : 0
      const rr = r0 * (1 + (scar ? 0.09 : -0.04))
      const base = t > 0.84 ? mixc(TRUNK, COLLAR, Math.min(1, (t - 0.84) / 0.12)) : TRUNK
      const col = scar ? mul(base, 1.2) : mul(mixc(base, SCAR, 0.62), 0.88 + 0.2 * rand())
      ring.push(b.v(c[0] + Math.cos(a) * rr, c[1], c[2] + Math.sin(a) * rr, col))
    }
    rings.push(ring)
  }
  for (let k = 0; k < R; k++)
    for (let s = 0; s < n; s++) {
      const a = rings[k][s]
      const c = rings[k][(s + 1) % n]
      const d = rings[k + 1][s]
      const e = rings[k + 1][(s + 1) % n]
      b.tri(a, c, d)
      b.tri(c, e, d)
    }
  const top = trunkAt(1)
  const capTop = b.v(top[0], top[1] + 0.35, top[2], [0.14, 0.2, 0.1])
  for (let s = 0; s < n; s++) b.tri(rings[R][s], rings[R][(s + 1) % n], capTop)

  // the crown: four tiers, from the young upright heart to the old drooping outer fronds
  const tiers = [
    { share: 0.17, el: 1.15, droop: 0.35, L: 3.2, tone: 1.12 },
    { share: 0.3, el: 0.78, droop: 0.95, L: 4.6, tone: 1.05 },
    { share: 0.3, el: 0.3, droop: 1.15, L: 5.5, tone: 1 },
    { share: 0.23, el: -0.12, droop: 0.85, L: 5.1, tone: 0.9 },
  ]
  const golden = 2.399963 // the phyllotactic angle: fronds are laid down in a spiral
  let idx = 0
  const origin = [top[0], top[1] + 0.2, top[2]]
  for (const tier of tiers) {
    const cnt = Math.max(2, Math.round(lod.fronds * tier.share))
    for (let f = 0; f < cnt; f++) {
      const az = idx * golden + rand() * 0.25
      const L = tier.L * (0.88 + 0.24 * rand())
      frond(b, origin, az, tier.el + (rand() - 0.5) * 0.2, tier.droop * (0.85 + 0.3 * rand()), L, tier.tone * (0.9 + 0.2 * rand()), lod, rand)
      idx++
    }
  }

  for (let d = 0; d < lod.dates; d++) dateBunch(b, [top[0], top[1] - 0.4, top[2]], (d / lod.dates) * Math.PI * 2 + rand() * 0.8, lod, rand)

  return b.geometry()
}

function makeMaterial() {
  const m = new MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, side: DoubleSide, flatShading: true })
  m.name = 'foliage'
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = SU.uTime
    shader.uniforms.uBlack = SU.uBlack
    shader.uniforms.uDark = SU.uDark
    // the dark theme turns the palms black like everything else
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uDark;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= 1.0 - 0.93 * uDark;')
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          // the crowns move in the wind: the fronds flex more towards their tips, the trunk hardly at all
          float ph = uTime * 1.1 + instanceMatrix[3].x * 0.21 + instanceMatrix[3].z * 0.17;
          float crown = smoothstep(8.0, 13.0, position.y);
          float sw = sin(ph) + 0.4 * sin(ph * 2.3 + position.x * 1.7 + position.z * 1.3);
          transformed.xz += vec2(sw, sw * 0.6) * 0.045 * smoothstep(2.0, 14.0, position.y);
          transformed.y += sin(ph * 1.7 + position.x * 2.1 + position.z * 1.9) * 0.05 * crown;
        #endif`,
      )
  }
  m.customProgramCacheKey = () => 'foliage-2'
  return m
}

// The positions come from palms.json: points chosen from the model itself, looking straight down — only
// where the top surface is the green planting (never under a roof plane, on a plaza, a road or bare earth,
// and never within 5 m of the edge of a green area). Date palms grow in groves, so most are clustered.
export default function Foliage({ groundGeometry, shadow = true }) {
  const built = useMemo(() => {
    if (!groundGeometry) return null // wait for the model: the planting appears with it
    const rand = rng(20260411)
    const material = makeMaterial()
    const pts = PALMS

    // how near does the camera's own path come to each tree? (the path is a pure function of progress)
    const cam = []
    const P = {}
    for (let i = 0; i <= 90; i++) {
      samplePath((i / 90) * 0.86, P)
      cam.push([P.x, P.y, P.z])
    }
    const near = (p) => {
      let m = 1e9
      for (const c of cam) {
        const d = Math.hypot(c[0] - p[0], c[1] - p[1], c[2] - p[2])
        if (d < m) m = d
      }
      return m
    }
    const buckets = [[[], [], []], [[], [], []], [[], [], []]] // [lod][variant]
    let n = 0
    for (const p of pts) {
      const d = near(p)
      const lod = d < 330 ? 0 : d < 720 ? 1 : 2
      buckets[lod][n++ % 3].push(p)
    }

    const o = new Object3D()
    const meshes = []
    for (let lod = 0; lod < 3; lod++)
      for (let v = 0; v < 3; v++) {
        const list = buckets[lod][v]
        if (!list.length) continue
        const mesh = new InstancedMesh(palmGeometry(lod, 9100 + v * 131 + lod), material, list.length)
        list.forEach((p, i) => {
          // a grove is of every age: young palms of 3–7 m, many of 9–14 m, and a few old giants of 20 m+
          const k = rand()
          const sy = k < 0.16 ? 0.3 + rand() * 0.28 : k < 0.5 ? 0.62 + rand() * 0.42 : k < 0.88 ? 1.04 + rand() * 0.42 : 1.5 + rand() * 0.45
          const sxz = Math.min(1.25, 0.5 + 0.45 * sy) * (0.92 + rand() * 0.16)
          o.position.set(p[0], p[1] - 0.2, p[2])
          o.rotation.set((rand() - 0.5) * 0.05, rand() * Math.PI * 2, (rand() - 0.5) * 0.05)
          o.scale.set(sxz, sy, sxz)
          o.updateMatrix()
          mesh.setMatrixAt(i, o.matrix)
        })
        mesh.instanceMatrix.needsUpdate = true
        mesh.castShadow = shadow && lod < 2
        mesh.receiveShadow = true
        mesh.frustumCulled = false
        mesh.name = `palm-lod${lod}-${v}`
        meshes.push(mesh)
      }
    return meshes
  }, [groundGeometry, shadow])
  if (!built) return null
  return (
    <>
      {built.map((m) => (
        <primitive key={m.name} object={m} />
      ))}
    </>
  )
}

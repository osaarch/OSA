import { useMemo } from 'react'
import { BufferAttribute, BufferGeometry, DoubleSide, IcosahedronGeometry, InstancedMesh, MeshStandardMaterial, Object3D } from 'three'
import { SU } from './materials'

// Palms and broadleaf trees, scattered over the planted ground of the model, so the
// river bank reads like the renders. Two instanced meshes: one draw call each.

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

function palmGeometry(rand) {
  const b = new Builder()
  const H = 11
  const lean = 0.9
  const trunkCol = [0.27, 0.2, 0.14]
  // trunk: 4 rings, slightly leaning
  const rings = []
  for (let k = 0; k <= 4; k++) {
    const t = k / 4
    const r = 0.5 - 0.22 * t
    const cx = lean * t * t
    const ring = []
    for (let s = 0; s < 5; s++) {
      const a = (s / 5) * Math.PI * 2
      const sh = 0.85 + 0.15 * ((k + s) % 2)
      ring.push(b.v(cx + Math.cos(a) * r, t * H, Math.sin(a) * r, trunkCol.map((x) => x * sh)))
    }
    rings.push(ring)
  }
  for (let k = 0; k < 4; k++)
    for (let s = 0; s < 5; s++) {
      const a = rings[k][s]
      const c = rings[k][(s + 1) % 5]
      const d = rings[k + 1][s]
      const e = rings[k + 1][(s + 1) % 5]
      b.tri(a, c, d)
      b.tri(c, e, d)
    }
  // crown: drooping fronds
  const top = [lean, H, 0]
  const N = 12
  for (let f = 0; f < N; f++) {
    const a = (f / N) * Math.PI * 2 + rand() * 0.4
    const L = 5.2 + rand() * 1.6
    const dx = Math.cos(a)
    const dz = Math.sin(a)
    const px = -dz
    const pz = dx
    const green = 0.9 + rand() * 0.3
    const spine = []
    for (let k = 0; k <= 5; k++) {
      const t = k / 5
      const r = L * t
      const y = Math.sin(t * 1.9) * 1.7 - t * t * 3.3 + 0.3
      const w = (0.15 + 0.95 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.05)), 0.7)) * 0.5
      const col = [0.17 * green + 0.06 * t, 0.3 * green, 0.1 * green]
      const cx = top[0] + dx * r
      const cy = top[1] + y
      const cz = top[2] + dz * r
      spine.push([
        b.v(cx + px * w, cy - 0.08, cz + pz * w, col),
        b.v(cx, cy + 0.14, cz, col.map((x) => x * 1.12)),
        b.v(cx - px * w, cy - 0.08, cz - pz * w, col),
      ])
    }
    for (let k = 0; k < 5; k++) {
      const [a0, a1, a2] = spine[k]
      const [b0, b1, b2] = spine[k + 1]
      b.tri(a0, a1, b0)
      b.tri(a1, b1, b0)
      b.tri(a1, a2, b1)
      b.tri(a2, b2, b1)
    }
  }
  return b.geometry()
}

function treeGeometry(rand) {
  const b = new Builder()
  const trunkCol = [0.24, 0.18, 0.13]
  const H = 3.6
  const ring = (y, r, off = 0) => {
    const rr = []
    for (let s = 0; s < 5; s++) {
      const a = (s / 5) * Math.PI * 2
      rr.push(b.v(off + Math.cos(a) * r, y, Math.sin(a) * r, trunkCol))
    }
    return rr
  }
  const r0 = ring(0, 0.35)
  const r1 = ring(H, 0.2, 0.2)
  for (let s = 0; s < 5; s++) {
    const n = (s + 1) % 5
    b.tri(r0[s], r0[n], r1[s])
    b.tri(r0[n], r1[n], r1[s])
  }
  const blobs = [
    [0.2, H + 2.2, 0, 3.4],
    [-1.6, H + 1.2, 1.0, 2.5],
    [1.8, H + 1.5, -0.8, 2.7],
    [0.4, H + 3.8, 0.6, 2.3],
  ]
  for (const [x, y, z, r] of blobs) {
    const ico = new IcosahedronGeometry(r, 1)
    const pos = ico.attributes.position
    const idx = ico.index
    const base = b.p.length / 3
    for (let i = 0; i < pos.count; i++) {
      const jitter = 0.88 + rand() * 0.24
      const shade = 0.75 + 0.5 * ((pos.getY(i) / r + 1) / 2) // lighter on top
      b.v(x + pos.getX(i) * jitter, y + pos.getY(i) * jitter * 0.85, z + pos.getZ(i) * jitter, [
        (0.1 + rand() * 0.04) * shade,
        (0.2 + rand() * 0.05) * shade,
        (0.07 + rand() * 0.03) * shade,
      ])
    }
    if (idx) for (let i = 0; i < idx.count; i += 3) b.tri(base + idx.getX(i), base + idx.getX(i + 1), base + idx.getX(i + 2))
    else for (let i = 0; i < pos.count; i += 3) b.tri(base + i, base + i + 1, base + i + 2)
  }
  return b.geometry()
}

function makeMaterial() {
  const m = new MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, side: DoubleSide, flatShading: true })
  m.name = 'foliage'
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = SU.uTime
    shader.uniforms.uBlack = SU.uBlack
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          float sw = sin(uTime * 1.1 + instanceMatrix[3].x * 0.21 + instanceMatrix[3].z * 0.17);
          transformed.xz += vec2(sw, sw * 0.6) * 0.07 * smoothstep(2.0, 14.0, position.y);
        #endif`,
      )
  }
  m.customProgramCacheKey = () => 'foliage'
  return m
}

// Sample points over the triangles of the planted ground (area-weighted, deterministic).
function scatter(geo, count, rand, rMin, rMax) {
  const pos = geo.attributes.position
  const idx = geo.index
  const tris = []
  let total = 0
  const a = [0, 0, 0]
  const b = [0, 0, 0]
  const c = [0, 0, 0]
  for (let i = 0; i < idx.count; i += 3) {
    const ia = idx.getX(i)
    const ib = idx.getX(i + 1)
    const ic = idx.getX(i + 2)
    a[0] = pos.getX(ia); a[1] = pos.getY(ia); a[2] = pos.getZ(ia)
    b[0] = pos.getX(ib); b[1] = pos.getY(ib); b[2] = pos.getZ(ib)
    c[0] = pos.getX(ic); c[1] = pos.getY(ic); c[2] = pos.getZ(ic)
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2]
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx
    const len = Math.hypot(nx, ny, nz)
    if (len < 1e-6 || Math.abs(ny) / len < 0.8) continue // only near-horizontal ground
    const cx = (a[0] + b[0] + c[0]) / 3, cz = (a[2] + b[2] + c[2]) / 3
    const r = Math.hypot(cx, cz)
    if (r < rMin || r > rMax) continue
    const area = len / 2
    total += area
    tris.push({ ia, ib, ic, area: total })
  }
  const out = []
  if (!tris.length) return out
  for (let n = 0; n < count; n++) {
    const target = rand() * total
    let lo = 0
    let hi = tris.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (tris[mid].area < target) lo = mid + 1
      else hi = mid
    }
    const t = tris[lo]
    let u = rand()
    let v = rand()
    if (u + v > 1) {
      u = 1 - u
      v = 1 - v
    }
    const w = 1 - u - v
    out.push([
      pos.getX(t.ia) * w + pos.getX(t.ib) * u + pos.getX(t.ic) * v,
      pos.getY(t.ia) * w + pos.getY(t.ib) * u + pos.getY(t.ic) * v,
      pos.getZ(t.ia) * w + pos.getZ(t.ib) * u + pos.getZ(t.ic) * v,
    ])
  }
  return out
}

export default function Foliage({ groundGeometry, palms = 420, trees = 340, shadow = true }) {
  const built = useMemo(() => {
    if (!groundGeometry) return null
    const rand = rng(20260411)
    const material = makeMaterial()
    const mk = (geo, pts, scaleLo, scaleHi) => {
      const mesh = new InstancedMesh(geo, material, pts.length)
      const o = new Object3D()
      pts.forEach((p, i) => {
        const s = scaleLo + rand() * (scaleHi - scaleLo)
        o.position.set(p[0], p[1] - 0.2, p[2])
        o.rotation.set((rand() - 0.5) * 0.08, rand() * Math.PI * 2, (rand() - 0.5) * 0.08)
        o.scale.set(s, s * (0.9 + rand() * 0.25), s)
        o.updateMatrix()
        mesh.setMatrixAt(i, o.matrix)
      })
      mesh.instanceMatrix.needsUpdate = true
      mesh.castShadow = shadow
      mesh.receiveShadow = true
      mesh.frustumCulled = false
      return mesh
    }
    const palmPts = scatter(groundGeometry, palms, rand, 200, 900)
    const treePts = scatter(groundGeometry, trees, rand, 200, 900)
    return { palms: mk(palmGeometry(rand), palmPts, 0.85, 1.35), trees: mk(treeGeometry(rand), treePts, 0.8, 1.4) }
  }, [groundGeometry, palms, trees, shadow])
  if (!built) return null
  return (
    <>
      <primitive object={built.palms} />
      <primitive object={built.trees} />
    </>
  )
}

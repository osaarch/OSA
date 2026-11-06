import { BoxGeometry, CylinderGeometry, Mesh, MeshStandardMaterial } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { applyDusk } from './earth'

// ─────────────────────────────────────────────────────────────────────────────
//  THE WALL OF THE GREAT MOSQUE (سور الجامع الكبير)
//  The Malwiya does not stand alone in the desert: it rises inside the outer enclosure
//  (the ziyada) of al-Mutawakkil's Great Mosque, a baked-brick wall 374 × 443 m, about 10 m
//  high and 2.6 m thick, reinforced by 44 semicircular towers, of which only the outer
//  wall survives today. This builds it at its real size around the tower (everything in metres):
//    · the tower stands 27 m outside the mosque proper, in the northern court — about 75 m
//      from the north wall, which is therefore the nearest one, behind the tower seen from the
//      south — and 190 m / 370 m from the east-west / south walls
//    · 44 towers: 4 at the corners and 10 on each side
//    · twelve gateways (a flat lintel over each opening), one on the tower's axis
//    · the crest is not perfectly even — a few bays have lost their top, as at the real site
//  The brick is the same earth brick as the tower (tile ≈ 3 m, so UVs are 0.33 per metre).
// ─────────────────────────────────────────────────────────────────────────────

const W = 376 // east–west
const L = 444 // north–south
const Z_NORTH = -75
const T = 2.65 // wall thickness
const H = 10.2 // wall height
const TR = 2.6 // tower radius
const TH = 11.2 // tower height
const K = 0.33 // texture tiles per metre (matches the tower's own UVs)
const GATE = 6.2
const LINTEL_Y = 6.6

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

// brick UVs in metres, projected along the dominant axis of each face
function projectUV(geo) {
  const p = geo.attributes.position
  const n = geo.attributes.normal
  const uv = geo.attributes.uv
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i))
    const ay = Math.abs(n.getY(i))
    const az = Math.abs(n.getZ(i))
    if (ay >= ax && ay >= az) uv.setXY(i, p.getX(i) * K, p.getZ(i) * K)
    else if (ax >= az) uv.setXY(i, p.getZ(i) * K, p.getY(i) * K)
    else uv.setXY(i, p.getX(i) * K, p.getY(i) * K)
  }
}

export function buildEnclosure({ map, bumpMap, bumpScale }) {
  const rand = rng(8561)
  const parts = []

  const box = (cx, cz, sx, sy, sz, y0 = 0) => {
    const g = new BoxGeometry(sx, sy, sz)
    g.translate(cx, y0 + sy / 2, cz)
    projectUV(g)
    parts.push(g)
  }
  const tower = (cx, cz) => {
    const broken = rand() < 0.08
    const h = broken ? TH * (0.45 + 0.25 * rand()) : TH * (0.94 + 0.08 * rand())
    const g = new CylinderGeometry(TR, TR * 1.04, h, 20, 1, false)
    g.translate(cx, h / 2, cz)
    const p = g.attributes.position
    const n = g.attributes.normal
    const uv = g.attributes.uv
    for (let i = 0; i < p.count; i++) {
      if (Math.abs(n.getY(i)) > 0.5) uv.setXY(i, p.getX(i) * K, p.getZ(i) * K) // the top
      else uv.setXY(i, uv.getX(i) * 2 * Math.PI * TR * K, p.getY(i) * K) // the shaft, unrolled
    }
    parts.push(g)
  }

  // one side of the wall: a run from `from` to `to` along one axis, with gateways at the given distances
  const side = (axis, fixed, from, to, gates) => {
    const len = to - from
    // cut the run into wall pieces and gateway lintels
    const cuts = [0]
    for (const g of gates) cuts.push(g - GATE / 2, g + GATE / 2)
    cuts.push(len)
    for (let c = 0; c < cuts.length; c += 2) {
      const a = cuts[c]
      const b = cuts[c + 1]
      const n = Math.max(1, Math.round((b - a) / 9))
      const sl = (b - a) / n
      for (let i = 0; i < n; i++) {
        const mid = from + a + sl * (i + 0.5)
        let h = H * (0.9 + 0.1 * rand())
        if (rand() < 0.06) h = H * (0.32 + 0.3 * rand()) // a bay that has lost its top
        if (axis === 'x') box(mid, fixed, sl, h, T)
        else box(fixed, mid, T, h, sl)
      }
    }
    for (const g of gates) {
      const mid = from + g
      if (axis === 'x') box(mid, fixed, GATE + 0.2, H - LINTEL_Y, T, LINTEL_Y)
      else box(fixed, mid, T, H - LINTEL_Y, GATE + 0.2, LINTEL_Y)
    }
  }

  const x0 = -W / 2
  const x1 = W / 2
  const z0 = Z_NORTH
  const z1 = Z_NORTH + L
  side('x', z0, x0, x1, [76, 188, 300]) //   north (the tower's gate is the middle one)
  side('x', z1, x0, x1, [76, 188, 300]) //   south
  side('z', x0, z0, z1, [111, 222, 333]) //  west
  side('z', x1, z0, z1, [111, 222, 333]) //  east

  // 44 semicircular towers, standing on the outer face: 4 corners + 10 on every side
  const o = T / 2
  for (const [cx, cz] of [
    [x0 - o, z0 - o],
    [x1 + o, z0 - o],
    [x0 - o, z1 + o],
    [x1 + o, z1 + o],
  ])
    tower(cx, cz)
  for (let j = 1; j <= 10; j++) {
    const fx = x0 + (W * j) / 11
    const fz = z0 + (L * j) / 11
    tower(fx, z0 - o)
    tower(fx, z1 + o)
    tower(x0 - o, fz)
    tower(x1 + o, fz)
  }

  const geo = mergeGeometries(parts, false)
  parts.forEach((g) => g.dispose())
  geo.computeBoundingSphere()
  const mat = applyDusk(
    new MeshStandardMaterial({ name: 'Enclosure_Brick', color: '#f4eee8', map, bumpMap, bumpScale, roughness: 0.95, metalness: 0 }),
  )
  const mesh = new Mesh(geo, mat)
  mesh.name = 'MosqueWall'
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

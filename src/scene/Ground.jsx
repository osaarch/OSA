import { useMemo } from 'react'
import { MeshStandardMaterial, PlaneGeometry } from 'three'
import { smoothstep } from '../journey'

// ── CPU side: slow, far-away dunes (flat near the monument so nothing ever clips) ──
function hash(x, y) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}
function vnoise(x, y) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi)
  const b = hash(xi + 1, yi)
  const c = hash(xi, yi + 1)
  const d = hash(xi + 1, yi + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
function duneHeight(x, z) {
  const r = Math.hypot(x, z)
  const w = smoothstep(520, 1700, r)
  if (w <= 0) return 0
  // wind-stretched ridges
  const px = x * 0.0011 + z * 0.0004
  const pz = z * 0.0021 - x * 0.0006
  let h = 0
  let a = 1
  let f = 1
  for (let i = 0; i < 4; i++) {
    const n = 1 - Math.abs(vnoise(px * f + 11.3, pz * f + 4.7) * 2 - 1)
    h += n * a
    a *= 0.5
    f *= 2.1
  }
  return (h - 0.9) * 46 * w
}

// ── GPU side: tone variation + wind-ripple relief that catches the low sun ──
const NOISE = /* glsl */ `
float hsh(vec2 p){ p = mod(p, 289.0); return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float vn(vec2 p){
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hsh(i), hsh(i + vec2(1.0, 0.0)), u.x), mix(hsh(i + vec2(0.0, 1.0)), hsh(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm3(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 3; i++){ s += a * vn(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; } return s; }
float sandH(vec2 p){
  float warp = vn(p * 0.05) * 5.0;
  float r = sin((p.x * 0.9 + p.y * 0.45) * 2.0 + warp);
  float pm = smoothstep(0.3, 0.8, vn(p * 0.022 + 7.0));
  return r * 0.03 * (0.25 + 0.75 * pm) + vn(p * 2.7) * 0.03 + vn(p * 11.0) * 0.01;
}
`

// 1 = the usual glints of the low sun on the sand; the dark theme turns them off so the dunes stay truly black
export const groundUniforms = { uSpec: { value: 1 } }

export function createGroundMaterial() {
  const mat = new MeshStandardMaterial({ color: '#cdb48a', roughness: 1, metalness: 0 })
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uSpec = groundUniforms.uSpec
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;',
      )
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vWPos;\nuniform float uSpec;\n${NOISE}`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         float camD = length(vWPos - cameraPosition);
         float toneLo  = fbm3(vWPos.xz * 0.0045);
         float toneMid = fbm3(vWPos.xz * 0.07 + 5.0);
         float toneHi  = vn(vWPos.xz * 1.4 + 3.0);
         vec3 sandTone = mix(vec3(0.88, 0.83, 0.74), vec3(1.05, 0.99, 0.89), toneLo);
         sandTone *= 0.92 + 0.14 * toneMid;
         sandTone *= 1.0 + (toneHi - 0.5) * 0.16 * (1.0 - smoothstep(50.0, 350.0, camD));
         diffuseColor.rgb *= sandTone;`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
         if (camD < 300.0) {
           vec2 sp = vWPos.xz;
           float e = 0.04;
           float dx = sandH(sp + vec2(e, 0.0)) - sandH(sp - vec2(e, 0.0));
           float dz = sandH(sp + vec2(0.0, e)) - sandH(sp - vec2(0.0, e));
           float k = (1.0 - smoothstep(25.0, 260.0, camD)) * 1.4;
           vec3 wn = normalize(vec3(-dx / (2.0 * e) * k, 1.0, -dz / (2.0 * e) * k));
           normal = normalize(normal + (viewMatrix * vec4(wn - vec3(0.0, 1.0, 0.0), 0.0)).xyz);
         }`,
      )
      .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\nreflectedLight.directSpecular *= uSpec;\nreflectedLight.indirectSpecular *= uSpec;')
  }
  mat.customProgramCacheKey = () => 'sand-ground-2'
  return mat
}

export default function Ground({ materialRef }) {
  const geometry = useMemo(() => {
    const R = 7000
    const seg = 360
    const g = new PlaneGeometry(R * 2, R * 2, seg, seg)
    g.rotateX(-Math.PI / 2)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) p.setY(i, duneHeight(p.getX(i), p.getZ(i)))
    g.computeVertexNormals()
    return g
  }, [])
  const material = useMemo(() => createGroundMaterial(), [])
  if (materialRef) materialRef.current = material
  return <mesh geometry={geometry} material={material} receiveShadow position={[0, -0.02, 0]} />
}

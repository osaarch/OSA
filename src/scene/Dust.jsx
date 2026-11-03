import { useMemo } from 'react'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, ShaderMaterial } from 'three'

const vertex = /* glsl */ `
attribute vec3 aSeed;   // x,z base position in the volume, y = height
attribute vec2 aPhase;  // phase, size
uniform float uTime; uniform float uScale; uniform float uSize;
varying float vAlpha;
void main(){
  float ph = aPhase.x;
  vec3 p = position;
  // slow wind drift, wrapped inside a 320 m box around the tower
  p.x = mod(p.x + uTime * 0.55 + 160.0, 320.0) - 160.0;
  p.z = mod(p.z + uTime * 0.18 + 160.0, 320.0) - 160.0;
  p.x += sin(uTime * 0.17 + ph * 6.283) * 2.4;
  p.y += sin(uTime * 0.23 + ph * 11.0) * 1.1;
  p.z += cos(uTime * 0.19 + ph * 9.0) * 2.4;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float dist = -mv.z;
  gl_PointSize = clamp(uSize * aPhase.y * uScale / max(dist, 0.1), 0.0, 14.0);
  vAlpha = (1.0 - smoothstep(70.0, 210.0, dist)) * smoothstep(2.0, 14.0, dist);
  gl_Position = projectionMatrix * mv;
}`

const fragment = /* glsl */ `
uniform vec3 uColor; uniform float uOpacity;
varying float vAlpha;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = smoothstep(0.5, 0.0, d);
  a *= a;
  gl_FragColor = vec4(uColor, a * vAlpha * uOpacity);
}`

export function createDustMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    fog: false,
    toneMapped: false,
    uniforms: {
      uTime: { value: 0 },
      uScale: { value: 900 },
      uSize: { value: 0.16 },
      uColor: { value: new Color('#ffe3b8') },
      uOpacity: { value: 0.35 },
    },
    vertexShader: vertex,
    fragmentShader: fragment,
  })
}

export default function Dust({ materialRef, count = 2200 }) {
  const geometry = useMemo(() => {
    const g = new BufferGeometry()
    const pos = new Float32Array(count * 3)
    const ph = new Float32Array(count * 2)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 320
      pos[i * 3 + 1] = 1 + Math.pow(Math.random(), 1.4) * 95
      pos[i * 3 + 2] = (Math.random() - 0.5) * 320
      ph[i * 2] = Math.random()
      ph[i * 2 + 1] = 0.5 + Math.random() * 1.2
    }
    g.setAttribute('position', new BufferAttribute(pos, 3))
    g.setAttribute('aPhase', new BufferAttribute(ph, 2))
    g.setAttribute('aSeed', new BufferAttribute(new Float32Array(count * 3), 3))
    return g
  }, [count])
  const material = useMemo(() => createDustMaterial(), [])
  if (materialRef) materialRef.current = material
  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={5} />
}

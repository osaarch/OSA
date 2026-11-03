import { useMemo } from 'react'
import { BufferAttribute, BufferGeometry, Color, ShaderMaterial, Vector2 } from 'three'

// Wind-blown sand grains, drawn in screen space at many depths. They drift with the
// wind and react to the cursor: the pointer pushes them away and swirls them around
// it, and moving the mouse drags nearby grains along. The whole field also shifts a
// little with the mouse, so it has parallax. Costs one draw call, no CPU per grain.

const vertex = /* glsl */ `
attribute float aRnd;
uniform float uTime; uniform float uAspect; uniform float uPx; uniform float uStorm; uniform float uAmp;
uniform vec2 uMouse; uniform vec2 uMouseVel; uniform vec2 uParallax;
varying float vA; varying float vTone;
void main(){
  float dep = position.z;                       // 0 = far, 1 = near
  vec2 p = position.xy * 2.0 - 1.0;
  float spd = mix(0.014, 0.12, dep) * (1.0 + 3.4 * uStorm);
  p.x = mod(p.x + 1.15 + uTime * spd, 2.3) - 1.15;
  p.y += (sin(uTime * 0.35 + aRnd * 40.0) * 0.02 + sin(p.x * 2.7 + uTime * 0.25 + aRnd * 9.0) * 0.015)
         * (0.3 + dep) * (1.0 + 2.0 * uStorm);
  p += uParallax * (dep - 0.25) * -0.11;

  // the cursor is a gust: push away, swirl, and drag along its motion
  vec2 q = vec2((p.x - uMouse.x) * uAspect, p.y - uMouse.y);
  float d2 = dot(q, q);
  float f = exp(-d2 * 5.0);
  vec2 dir = q * inversesqrt(d2 + 1e-4);
  vec2 tang = vec2(-dir.y, dir.x);
  float w = 0.35 + dep;
  vec2 push = (dir * 0.15 + tang * 0.12) * f * w + uMouseVel * f * 0.28 * w;
  p += vec2(push.x / uAspect, push.y);

  gl_Position = vec4(p, 0.0, 1.0);
  gl_PointSize = (1.4 + 4.4 * dep * (0.4 + aRnd)) * uPx;
  vTone = aRnd;
  vA = (0.22 + 0.55 * dep) * uAmp * (0.7 + 0.6 * aRnd);
}`

const fragment = /* glsl */ `
uniform vec3 uDark; uniform vec3 uLight;
varying float vA; varying float vTone;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.12, d);
  vec3 col = mix(uDark, uLight, step(0.6, vTone));
  gl_FragColor = vec4(col, a * vA);
  #include <colorspace_fragment>
}`

export function createGrainMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    fog: false,
    toneMapped: false,
    uniforms: {
      uTime: { value: 0 },
      uAspect: { value: 1.6 },
      uPx: { value: 1 },
      uStorm: { value: 1 },
      uAmp: { value: 1 },
      uMouse: { value: new Vector2(2, 2) },
      uMouseVel: { value: new Vector2(0, 0) },
      uParallax: { value: new Vector2(0, 0) },
      uDark: { value: new Color('#8f7650') },
      uLight: { value: new Color('#f3e4c2') },
    },
    vertexShader: vertex,
    fragmentShader: fragment,
  })
}

export default function Grains({ meshRef, materialRef, count = 2600 }) {
  const geometry = useMemo(() => {
    const g = new BufferGeometry()
    const pos = new Float32Array(count * 3)
    const r = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = Math.random()
      pos[i * 3 + 1] = Math.random()
      pos[i * 3 + 2] = Math.pow(Math.random(), 1.6)
      r[i] = Math.random()
    }
    g.setAttribute('position', new BufferAttribute(pos, 3))
    g.setAttribute('aRnd', new BufferAttribute(r, 1))
    return g
  }, [count])
  const material = useMemo(() => createGrainMaterial(), [])
  if (materialRef) materialRef.current = material
  return <points ref={meshRef} geometry={geometry} material={material} frustumCulled={false} renderOrder={900} />
}

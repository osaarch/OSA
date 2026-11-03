import { useMemo } from 'react'
import { Color, PlaneGeometry, ShaderMaterial, Vector2 } from 'three'

// The sandstorm: a full-screen veil of swirling dust that sits in front of the scene.
// At the start it is almost opaque; over the intro it thins into wisps and blows away
// to reveal the Malwiya. The cursor acts as wind: moving the mouse clears a soft path
// through the dust (and drags the swirl along with it).

const vertex = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`

const fragment = /* glsl */ `
uniform float uTime; uniform float uStorm; uniform float uAspect; uniform float uActive;
uniform vec2 uMouse; uniform vec2 uMouseVel; uniform vec3 uColor;
varying vec2 vUv;

float hsh(vec2 p){ p = mod(p, 289.0); return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float vn(vec2 p){
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hsh(i), hsh(i + vec2(1.0, 0.0)), u.x), mix(hsh(i + vec2(0.0, 1.0)), hsh(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float s = 0.0, a = 0.5;
  for (int i = 0; i < OCT; i++){ s += a * vn(p); p = p * 2.02 + vec2(11.7, 3.1); a *= 0.5; }
  return s;
}

void main(){
  vec2 uv = vUv;
  float t = uTime;
  vec2 p = vec2(uv.x * uAspect, uv.y) * 1.5;

  // cursor = wind: an elongated gaussian trailing behind the motion
  vec2 q = vec2((uv.x - uMouse.x) * uAspect, uv.y - uMouse.y);
  float sp = length(uMouseVel);
  vec2 dir = uMouseVel / (sp + 1e-3);
  float along = dot(q, dir);
  float perp = length(q - dir * along);
  vec2 qa = vec2(along * (along < 0.0 ? 0.32 : 1.0), perp);
  float r2 = 0.035 + 0.06 * min(sp, 1.6);
  float clearing = exp(-dot(qa, qa) / r2) * uActive;

  // domain-warped fractal noise, advected by the wind
  vec2 w = vec2(fbm(p * 0.9 + vec2(t * 0.05, 0.0)), fbm(p * 0.9 + vec2(5.2, 1.3 - t * 0.04)));
  vec2 pp = p + (w - 0.5) * 1.7 + vec2(t * 0.11, t * 0.015);
  pp += vec2(-q.y, q.x) * clearing * 1.4; // swirl around the cursor
  float n = fbm(pp * 1.1);
  float dens = clamp((n - 0.2) * 1.9, 0.0, 1.0);

  float streak = vn(vec2(uv.x * uAspect * 0.7 + t * 0.6, uv.y * 34.0));
  // storm 1: a solid wall of dust. As it falls the dust breaks into drifting clumps and
  // wisps (patchy clearing) until nothing is left.
  float centre = 1.15 - 1.45 * uStorm;
  float a = smoothstep(centre - 0.26, centre + 0.26, n + 0.08 * streak);
  a *= smoothstep(0.0, 0.07, uStorm);
  a *= 1.0 - clearing * 0.94;

  // dust piles up in a darker ring around the cleared hole
  float rim = exp(-pow(sqrt(dot(qa, qa)) - 0.2, 2.0) / 0.006) * uActive;
  vec3 col = uColor * (0.86 + 0.26 * dens) * (1.0 - 0.2 * rim);
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`

const IS_COARSE = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches

export function createVeilMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    fog: false,
    defines: { OCT: IS_COARSE ? 3 : 4 },
    uniforms: {
      uTime: { value: 0 },
      uStorm: { value: 1 },
      uAspect: { value: 1.6 },
      uActive: { value: 0 },
      uMouse: { value: new Vector2(2, 2) },
      uMouseVel: { value: new Vector2(0, 0) },
      uColor: { value: new Color('#dccaa6') },
    },
    vertexShader: vertex,
    fragmentShader: fragment,
  })
}

export default function Veil({ meshRef, materialRef }) {
  const material = useMemo(() => createVeilMaterial(), [])
  const geometry = useMemo(() => new PlaneGeometry(2, 2), [])
  if (materialRef) materialRef.current = material
  return <mesh ref={meshRef} geometry={geometry} material={material} renderOrder={1000} frustumCulled={false} />
}

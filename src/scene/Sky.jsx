import { useMemo } from 'react'
import { BackSide, Color, ShaderMaterial, Vector3 } from 'three'

const vertex = /* glsl */ `
varying vec3 vDir;
void main(){
  vDir = normalize(position);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww; // always at the far plane
}`

const fragment = /* glsl */ `
uniform vec3 uHorizon; uniform vec3 uZenith; uniform vec3 uSunCol; uniform vec3 uSunDir; uniform float uGlow;
varying vec3 vDir;
float dither(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec3 d = normalize(vDir);
  float h = max(d.y, 0.0);
  float t = pow(h, 0.5);
  vec3 col = mix(uHorizon, uZenith, t);
  float sd = max(dot(d, uSunDir), 0.0);
  float band = 1.0 - smoothstep(0.0, 0.55, h);
  col += uSunCol * uGlow * (pow(sd, 6.0) * 0.30 * (0.45 + band) + pow(sd, 90.0) * 0.55 + pow(sd, 900.0) * 3.0);
  col += (dither(gl_FragCoord.xy) - 0.5) / 255.0;
  gl_FragColor = vec4(max(col, 0.0), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`

export function createSkyMaterial() {
  return new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    depthTest: false,
    fog: false,
    uniforms: {
      uHorizon: { value: new Color('#eadcc0') },
      uZenith: { value: new Color('#cdb48c') },
      uSunCol: { value: new Color('#fff0d4') },
      uSunDir: { value: new Vector3(0, 0.5, 0.8).normalize() },
      uGlow: { value: 1 },
    },
    vertexShader: vertex,
    fragmentShader: fragment,
  })
}

export default function Sky({ meshRef, materialRef }) {
  const material = useMemo(() => createSkyMaterial(), [])
  if (materialRef) materialRef.current = material
  return (
    <mesh ref={meshRef} material={material} renderOrder={-1000} frustumCulled={false} scale={4800}>
      <sphereGeometry args={[1, 48, 28]} />
    </mesh>
  )
}

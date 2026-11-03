import { Color, DoubleSide, MeshStandardMaterial, Vector3 } from 'three'

// ─────────────────────────────────────────────────────────────────────────────
//  THE MATERIALS OF AL-RAFIDAIN STADIUM
//  Everything is clay and earth: rammed-earth strata on the tilted walls, dust-pale
//  tops, pitted and cracked, with a rough, matte, hand-finished surface. All of it is
//  generated in the shader from world position (no textures), so the model stays
//  light and the grain stays sharp at any distance.
//  At night the same walls glow red from within — driven by one uniform (uNight).
// ─────────────────────────────────────────────────────────────────────────────

// uniforms shared by every material of the scene (written once per frame by the rig)
export const SU = {
  uTime: { value: 0 },
  uNight: { value: 0 }, // 0 day … 1 the red-lit night
  uCrowd: { value: 0 }, // 0 … 1 the bowl fills with spectators
  uBlack: { value: 0 }, // 1 = everything gone
  uRed: { value: new Color('#ff3326') },
  uSkyH: { value: new Color('#f0d2a0') },
  uSkyZ: { value: new Color('#cfae86') },
}

const NOISE = /* glsl */ `
varying vec3 vWP;
uniform float uTime; uniform float uNight; uniform float uCrowd; uniform float uBlack;
uniform vec3 uRed; uniform vec3 uSkyH; uniform vec3 uSkyZ;

float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
// value noise with analytic derivatives (x = value, yz = d/dx d/dy)
vec3 noised(vec2 x){
  vec2 p = floor(x); vec2 w = fract(x);
  vec2 u = w*w*w*(w*(w*6.0-15.0)+10.0);
  vec2 du = 30.0*w*w*(w*(w-2.0)+1.0);
  float a = h21(p), b = h21(p+vec2(1.0,0.0)), c = h21(p+vec2(0.0,1.0)), d = h21(p+vec2(1.0,1.0));
  float k1 = b-a, k2 = c-a, k4 = a-b-c+d;
  return vec3(a + k1*u.x + k2*u.y + k4*u.x*u.y, du*vec2(k1 + k4*u.y, k2 + k4*u.x));
}
vec3 fbmd(vec2 p){
  float a = 0.5, fr = 1.0; vec3 s = vec3(0.0);
  for(int i = 0; i < 4; i++){
    vec3 n = noised(p * fr + vec2(float(i) * 17.1, float(i) * 9.2));
    s += a * vec3(n.x, n.yz * fr);
    fr *= 2.03; a *= 0.5;
  }
  return s;
}
float fbm1(vec2 p){ return fbmd(p).x; }

// triplanar height + world-space gradient of the surface grain
float grain3(vec3 p, vec3 n, float sc, out vec3 g){
  vec3 w = pow(abs(n), vec3(4.0)); w /= (w.x + w.y + w.z + 1e-4);
  vec3 a = fbmd(p.xz * sc);            // top / bottom
  vec3 b = fbmd(vec2(p.z, p.y) * sc);  // faces looking along x
  vec3 c = fbmd(vec2(p.x, p.y) * sc);  // faces looking along z
  g = w.y * vec3(a.y, 0.0, a.z) + w.x * vec3(0.0, b.z, b.y) + w.z * vec3(c.y, c.z, 0.0);
  g *= sc;
  return w.y * a.x + w.x * b.x + w.z * c.x;
}
vec3 bumpN(vec3 N, vec3 g, float k){ return normalize(N - k * (g - dot(g, N) * N)); }
`

function patch(mat, { pars = '', body = '', emissive = '' }) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, SU)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${NOISE}\n${pars}`)
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        vec3 nW = inverseTransformDirection(normal, viewMatrix);
        float camD = length(vViewPosition);
        vec3 glow = vec3(0.0);
        {
        ${body}
        }`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += glow * (1.0 - uBlack);${emissive}`,
      )
  }
  mat.customProgramCacheKey = () => 'stadium-' + mat.name
  return mat
}

const base = (name, extra = {}) =>
  new MeshStandardMaterial({ name, color: '#ffffff', roughness: 0.96, metalness: 0, side: DoubleSide, flatShading: true, ...extra })

// ── clay: the tilted roof planes and walls ───────────────────────────────────
function clay() {
  return patch(base('clay'), {
    body: /* glsl */ `
      vec3 g; float hgt = grain3(vWP, nW, 0.55, g);
      float top = smoothstep(0.45, 0.85, nW.y);
      float fade = 1.0 - smoothstep(70.0, 420.0, camD);
      normal = normalize((viewMatrix * vec4(bumpN(nW, g, 0.07 * fade), 0.0)).xyz);
      nW = inverseTransformDirection(normal, viewMatrix);

      // rammed-earth strata: soft horizontal layers, warped by the grain
      float lay = vWP.y * 0.42 + fbm1(vWP.xz * 0.03) * 4.0 + hgt * 1.2;
      float strata = sin(lay * 6.2831) * 0.5 + 0.5;
      float coarse = fbm1(vec2(vWP.x + vWP.z, vWP.y) * 0.08);
      vec3 cLight = vec3(0.66, 0.54, 0.41);
      vec3 cMid   = vec3(0.50, 0.38, 0.28);
      vec3 cDark  = vec3(0.36, 0.25, 0.17);
      vec3 col = mix(cMid, cLight, smoothstep(0.25, 0.8, hgt * 0.7 + coarse * 0.5));
      col = mix(col, cDark, 0.38 * strata * (1.0 - top) * (0.4 + hgt));
      // wind-blown dust settles on the upward faces
      col = mix(col, vec3(0.74, 0.64, 0.50), 0.6 * top * (0.55 + 0.45 * coarse));
      // hairline cracks
      float cr = 1.0 - smoothstep(0.0, 0.035, abs(fbm1(vWP.xz * 0.35 + vWP.y * 0.2) - 0.5));
      col *= 1.0 - 0.3 * cr * fade;
      diffuseColor.rgb = col;
      roughnessFactor = 0.97;

      // night: the walls glow from within, the roofs stay dark
      float side = 1.0 - smoothstep(0.30, 0.72, nW.y);
      float low = mix(1.0, 0.55, smoothstep(8.0, 95.0, vWP.y));
      glow = uRed * uNight * side * low * (0.55 + 0.6 * fbm1(vWP.xz * 0.06 + vWP.y * 0.1)) * 1.35;
    `,
  })
}

// ── the seating bowl: deep red, filling with spectators ──────────────────────
function bowl() {
  return patch(base('bowl'), {
    body: /* glsl */ `
      float top = smoothstep(0.2, 0.7, nW.y);
      float rows = 0.5 + 0.5 * sin(length(vWP.xz * vec2(1.0, 1.25)) * 3.4);
      vec3 col = mix(vec3(0.22, 0.045, 0.04), vec3(0.34, 0.07, 0.055), rows * 0.6 + 0.2 * fbm1(vWP.xz * 0.4));
      // spectators: one person per ~1.1 m, switched on gradually as uCrowd rises
      vec2 cell = vWP.xz / 1.1; vec2 id = floor(cell); vec2 f = fract(cell) - 0.5;
      vec2 jit = (vec2(h21(id + 7.3), h21(id + 3.1)) - 0.5) * 0.3;
      float dd = length(f - jit);
      float person = smoothstep(0.34, 0.2, dd);
      float present = step(h21(id), uCrowd * 0.9);
      float aa = 1.0 - smoothstep(0.3, 0.7, max(fwidth(cell.x), fwidth(cell.y)));
      vec3 cloth = mix(vec3(1.0, 0.8, 0.55), vec3(1.0, 0.3, 0.2), h21(id + 1.7));
      float pm = person * present * aa * top;
      col = mix(col, cloth * 0.85, pm);
      diffuseColor.rgb = col;
      roughnessFactor = 0.9;
      glow = uRed * uNight * (0.5 + 0.35 * rows) * 0.9 + cloth * pm * (0.4 + 1.3 * uCrowd);
    `,
  })
}

// ── the very dark brown glazing under the roof planes ────────────────────────
function glass() {
  return patch(base('glass', { roughness: 0.22, metalness: 0.45 }), {
    body: /* glsl */ `
      diffuseColor.rgb = vec3(0.07, 0.045, 0.032);
      roughnessFactor = 0.22;
      glow = uRed * uNight * 0.2;
    `,
  })
}

// ── the lettering on the facade ──────────────────────────────────────────────
function lettering() {
  return patch(base('text'), {
    body: /* glsl */ `
      diffuseColor.rgb = vec3(0.82, 0.72, 0.58);
      glow = vec3(1.0, 0.86, 0.68) * uNight * 1.7;
    `,
  })
}

// ── ground: dry earth, dunes of fine ripple, a red wash at night ─────────────
function ground() {
  return patch(base('ground'), {
    body: /* glsl */ `
      vec3 g; float hgt = grain3(vWP, nW, 0.9, g);
      float fade = 1.0 - smoothstep(40.0, 300.0, camD);
      normal = normalize((viewMatrix * vec4(bumpN(nW, g, 0.12 * fade), 0.0)).xyz);
      float big = fbm1(vWP.xz * 0.0035);
      float mid = fbm1(vWP.xz * 0.025 + 3.0);
      vec3 sandA = vec3(0.78, 0.64, 0.46), sandB = vec3(0.6, 0.46, 0.33), sandC = vec3(0.47, 0.35, 0.26);
      vec3 col = mix(sandB, sandA, smoothstep(0.2, 0.85, mid * 0.7 + hgt * 0.4));
      col = mix(col, sandC, smoothstep(0.35, 0.8, big) * 0.65);
      diffuseColor.rgb = col;
      roughnessFactor = 1.0;
      float near = exp(-pow(length(vWP.xz) / 320.0, 2.0));
      glow = uRed * uNight * near * 0.2 * (0.5 + 0.5 * mid);
    `,
  })
}

// ── planting: dry olive and straw ────────────────────────────────────────────
function grass() {
  return patch(base('grass'), {
    body: /* glsl */ `
      float n = fbm1(vWP.xz * 0.05); float n2 = fbm1(vWP.xz * 0.6);
      vec3 col = mix(vec3(0.17, 0.175, 0.09), vec3(0.37, 0.31, 0.17), smoothstep(0.3, 0.8, n));
      col *= 0.88 + 0.24 * n2;
      diffuseColor.rgb = col;
      roughnessFactor = 1.0;
      float near = exp(-pow(length(vWP.xz) / 320.0, 2.0));
      glow = uRed * uNight * near * 0.12;
    `,
  })
}

// ── paths and roads: dark, dusty earth ───────────────────────────────────────
function paving() {
  return patch(base('paving'), {
    body: /* glsl */ `
      float n = fbm1(vWP.xz * 0.15);
      diffuseColor.rgb = mix(vec3(0.20, 0.16, 0.13), vec3(0.31, 0.25, 0.19), n);
      roughnessFactor = 0.95;
      float near = exp(-pow(length(vWP.xz) / 320.0, 2.0));
      glow = uRed * uNight * near * 0.1;
    `,
  })
}

// ── the river: dark, still, carrying the sky — and the red of the night ──────
function water() {
  return patch(base('water', { roughness: 0.07 }), {
    body: /* glsl */ `
      // small moving ripples bend the normal
      vec2 q = vWP.xz * 0.22 + vec2(uTime * 0.05, uTime * 0.03);
      vec3 r1 = fbmd(q); vec3 r2 = fbmd(q * 2.3 - uTime * 0.04);
      vec3 gw = vec3(r1.y + r2.y, 0.0, r1.z + r2.z) * 0.22;
      float fade = 1.0 - smoothstep(60.0, 500.0, camD);
      normal = normalize((viewMatrix * vec4(bumpN(vec3(0.0, 1.0, 0.0), gw, 0.5 * fade), 0.0)).xyz);
      nW = inverseTransformDirection(normal, viewMatrix);
      diffuseColor.rgb = vec3(0.045, 0.055, 0.05);
      roughnessFactor = 0.06;
      vec3 V = normalize(vViewPosition);
      float fres = pow(1.0 - clamp(dot(normal, V), 0.0, 1.0), 3.5);
      vec3 refl = mix(uSkyH, uSkyZ, 0.35);
      float near = exp(-pow(length(vWP.xz) / 380.0, 2.0));
      float streak = 0.55 + 0.9 * (r1.x * 0.6 + r2.x * 0.4);
      glow = refl * (0.06 + 0.85 * fres) + uRed * uNight * near * 0.85 * streak;
    `,
  })
}

export function createMaterials() {
  return { roof: clay(), bowl: bowl(), wall: glass(), text: lettering(), ground: ground(), grass: grass(), paving: paving(), water: water() }
}

export const SUN_DIR = new Vector3()

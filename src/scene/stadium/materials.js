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
  uDark: { value: 0 }, // 1 = the dark theme: every surface turns black
  uAmber: { value: 0 }, // 1 = the dark theme: black everywhere, only the glazing lit in an earth-amber
  uRed: { value: new Color('#ff3326') },
  uSkyH: { value: new Color('#f0d2a0') },
  uSkyZ: { value: new Color('#cfae86') },
}

const NOISE = /* glsl */ `
varying vec3 vWP;
uniform float uTime; uniform float uNight; uniform float uCrowd; uniform float uBlack; uniform float uDark; uniform float uAmber;
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
// the architect's layer colour, turned into a tint for the earth: lighter layers stay lighter, darker ones
// darker, and a little of the hue comes through — the surface itself is still the same clay and dust
vec3 layerTint(vec3 c, float lumAmt, float hueAmt){
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  vec3 hue = c / max(l, 0.04);
  return mix(vec3(1.0), hue, hueAmt) * mix(1.0, 0.45 + 1.15 * l, lumAmt);
}
`

// `keep` (0…1) is how much of a surface's own glow survives the dark theme (the glazing keeps all of it).
function patch(mat, { pars = '', body = '', emissive = '', keep = 0 }) {
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
        vec3 vcol = diffuseColor.rgb; // the Rhino layer colour (white where the mesh carries none)
        vec3 glow = vec3(0.0);
        {
        ${body}
        }
        // the dark theme: every surface goes black, with a satin sheen so the forms still catch a thin
        // rim of cold light along their edges (and nothing glows red)
        diffuseColor.rgb *= 1.0 - 0.93 * uDark;
        roughnessFactor = mix(roughnessFactor, clamp(roughnessFactor, 0.3, 0.6), uDark);
        vec3 dRim = vec3(0.42, 0.47, 0.56) * pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 3.0) * 0.16 * uDark;
        // the dark theme: black, but for a thin amber edge and a trace of amber on the upward faces,
        // so the black forms still read against the black sky
        float aOff = uAmber * (1.0 - ${keep.toFixed(2)});
        diffuseColor.rgb *= 1.0 - 0.97 * aOff;
        vec3 aRim = vec3(0.86, 0.53, 0.24) * (pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 4.0) * 0.05 + 0.002 * smoothstep(0.3, 0.9, nW.y)) * aOff;
        glow *= 1.0 - aOff;`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += glow * (1.0 - uBlack) * (1.0 - uDark) + (dRim + aRim) * (1.0 - uBlack);${emissive}`,
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
// The people sit in the seat rows (concentric about the pitch), one every ~1.5 m, in the
// quiet colours of ordinary clothes — bone, sand, faded brick, charcoal, dusty teal, olive —
// so a full stand reads as a crowd, not as a pattern. Seen from far away (when a person is
// smaller than a pixel) they melt into an average tone rather than vanishing.
function bowl() {
  return patch(base('bowl'), {
    body: /* glsl */ `
      float top = smoothstep(0.2, 0.7, nW.y);
      float rr = length(vWP.xz * vec2(1.0, 1.25));
      float rows = 0.5 + 0.5 * sin(rr * 3.4);
      vec3 col = mix(vec3(0.22, 0.045, 0.04), vec3(0.34, 0.07, 0.055), rows * 0.6 + 0.2 * fbm1(vWP.xz * 0.4));

      float rowW = 1.85, seatW = 1.55;
      float rid = floor(rr / rowW); float rf = fract(rr / rowW) - 0.5;
      float arc = atan(vWP.z * 1.25, vWP.x) * (rid + 0.5) * rowW;
      float cid = floor(arc / seatW); float cf = fract(arc / seatW) - 0.5;
      vec2 id = vec2(rid, cid);
      vec2 pp = vec2(cf * seatW, rf * rowW + (h21(id + 3.1) - 0.5) * 0.18);
      float dd = length(pp / vec2(0.5, 0.58));
      float person = 1.0 - smoothstep(0.7, 1.0, dd);
      float want = uCrowd * 0.94;
      float present = step(h21(id), want);
      float foot = fwidth(rr) / rowW;                     // rows per pixel
      float aa = 1.0 - smoothstep(0.35, 0.85, foot);

      float k = h21(id + 1.7) * 6.0;
      vec3 cloth = vec3(0.72, 0.66, 0.55);                // bone
      cloth = mix(cloth, vec3(0.58, 0.48, 0.36), step(1.0, k));  // sand
      cloth = mix(cloth, vec3(0.50, 0.30, 0.24), step(2.0, k));  // faded brick
      cloth = mix(cloth, vec3(0.27, 0.25, 0.24), step(3.0, k));  // charcoal
      cloth = mix(cloth, vec3(0.36, 0.43, 0.42), step(4.0, k));  // dusty teal
      cloth = mix(cloth, vec3(0.43, 0.41, 0.27), step(5.0, k));  // olive
      cloth *= 0.82 + 0.3 * (1.0 - dd);

      float pm = person * present * aa * top;
      col = mix(col, cloth * 0.9, pm);
      // too small to resolve: the average of a full stand
      float cover = want * 0.34 * top * (1.0 - aa);
      col = mix(col, vec3(0.43, 0.36, 0.29), cover * 0.85);
      diffuseColor.rgb = col;
      roughnessFactor = 0.9;
      glow = uRed * uNight * (0.5 + 0.35 * rows) * 0.9 * (1.0 - 0.28 * cover)
           + cloth * pm * (0.08 + 0.5 * uNight)
           + vec3(0.43, 0.36, 0.29) * cover * 0.28 * uNight;
    `,
  })
}

// ── the glazing: black by day, lit from inside by night ──────────────────────
// Black glass with only a faint sheen of sky at grazing angles; once the red night comes it lights
// up from within in one even colour (no panes, no mullions, no lines — just a soft drift of
// brightness across the facade).
const GLASS_LIT = 'vec3(0.40, 0.76, 1.0)' // sky-blue (tested against red: it reads as light, red melts into the walls)
const GLASS_AMBER = 'vec3(0.95, 0.5, 0.17)' // the dark theme: the glazing lit in an earth-amber, the one colour besides black
function glass() {
  return patch(base('glass', { roughness: 0.08, metalness: 0.3 }), {
    body: /* glsl */ `
      vec3 V = normalize(vViewPosition);
      float fres = pow(1.0 - clamp(dot(normal, V), 0.0, 1.0), 2.6);

      float flat_ = step(0.72, abs(nW.y));
      vec2 tg = vec2(-nW.z, nW.x); float tl = length(tg);
      tg = tl > 0.12 ? tg / tl : vec2(1.0, 0.0);
      float along = mix(dot(vWP.xz, tg), vWP.x, flat_);
      float up = mix(vWP.y, vWP.z, flat_);
      float drift = fbm1(vec2(along * 0.035, up * 0.05) + 4.0);

      diffuseColor.rgb = vec3(0.010, 0.010, 0.012);
      roughnessFactor = 0.08;

      vec3 sky = mix(uSkyH, uSkyZ, 0.25 + 0.6 * clamp(vWP.y / 70.0, 0.0, 1.0));
      float lit = smoothstep(0.2, 0.95, uNight);
      glow = sky * (0.012 + 0.2 * fres) * (1.0 - 0.6 * lit)
           + mix(${GLASS_LIT}, ${GLASS_AMBER}, uAmber) * lit * (0.62 + 0.62 * drift) * (0.9 + 0.1 * (1.0 - fres)) * (1.0 - 0.5 * uAmber);
    `,
    keep: 1,
  })
}

// ── the lettering on the facade ──────────────────────────────────────────────
function lettering() {
  return patch(base('text'), {
    body: /* glsl */ `
      diffuseColor.rgb = vec3(0.82, 0.72, 0.58);
      glow = mix(vec3(1.0, 0.86, 0.68), vec3(0.95, 0.58, 0.25), uAmber) * uNight * 1.7;
    `,
    keep: 0.9,
  })
}

// ── the pitch: sage turf with soft mown bands and faint chalk, in a margin of dry clay ───
// (105 × 68 m, long axis along x, centred on the middle of the bowl floor)
function pitch() {
  return patch(base('pitch'), {
    body: /* glsl */ `
      // the bowl's long axis is turned 15.2° from the x axis: the pitch follows it
      vec2 q0 = vWP.xz - vec2(-0.45, 0.0);
      const vec2 AX = vec2(0.9650, -0.2622);
      vec2 q = vec2(dot(q0, AX), dot(q0, vec2(-AX.y, AX.x)));
      float n = fbm1(vWP.xz * 0.7); float n2 = fbm1(vWP.xz * 3.5);
      float band = step(0.5, fract(q.x / 15.0));
      vec3 turf = mix(vec3(0.285, 0.33, 0.205), vec3(0.335, 0.38, 0.24), band) * (0.9 + 0.18 * n) * (0.95 + 0.1 * n2);
      vec3 earth = mix(vec3(0.44, 0.35, 0.26), vec3(0.54, 0.44, 0.32), n) * (0.94 + 0.1 * n2);

      vec2 dq = abs(q) - vec2(57.0, 39.0);
      float sdT = length(max(dq, 0.0)) + min(max(dq.x, dq.y), 0.0);
      float turfM = 1.0 - smoothstep(-0.8, 0.8, sdT);
      vec3 col = mix(earth, turf, turfM);

      // chalk lines (FIFA proportions)
      float w = max(0.3, fwidth(q.x) * 0.85);
      vec2 d0 = abs(q) - vec2(52.5, 34.0);
      float L = abs(length(max(d0, 0.0)) + min(max(d0.x, d0.y), 0.0));
      L = min(L, abs(q.x));                                  // halfway line
      L = min(L, abs(length(q) - 9.15));                     // centre circle
      float spot = length(q) - 0.35;
      for (int i = 0; i < 2; i++) {
        float sg = i == 0 ? -1.0 : 1.0;
        vec2 pa = q - vec2(sg * 44.25, 0.0);                 // penalty area 16.5 x 40.3
        vec2 da = abs(pa) - vec2(8.25, 20.15);
        L = min(L, abs(length(max(da, 0.0)) + min(max(da.x, da.y), 0.0)));
        vec2 pg = q - vec2(sg * 49.75, 0.0);                 // goal area 5.5 x 18.3
        vec2 dg = abs(pg) - vec2(2.75, 9.15);
        L = min(L, abs(length(max(dg, 0.0)) + min(max(dg.x, dg.y), 0.0)));
        float arc = abs(length(q - vec2(sg * 41.5, 0.0)) - 9.15);
        L = min(L, arc + (sg * q.x > 36.0 ? 100.0 : 0.0));   // the "D" outside the area
        spot = min(spot, length(q - vec2(sg * 41.5, 0.0)) - 0.35);
      }
      float line = (1.0 - smoothstep(w * 0.55, w * 1.15, L)) + (1.0 - smoothstep(0.0, w * 0.6, spot));
      col = mix(col, vec3(0.72, 0.7, 0.62), clamp(line, 0.0, 1.0) * 0.5 * turfM);

      diffuseColor.rgb = col;
      roughnessFactor = 0.95;
      // by night the pitch keeps a dim, even light of its own, and a trace of the red
      glow = col * uNight * (0.2 + 0.26 * turfM) + uRed * uNight * 0.03;
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
      col *= layerTint(vcol, 0.5, 0.3);
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
      col *= layerTint(vcol, 0.7, 0.2);
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
      vec3 col = mix(vec3(0.20, 0.16, 0.13), vec3(0.31, 0.25, 0.19), n);
      diffuseColor.rgb = col * layerTint(vcol, 0.85, 0.3);
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
    keep: 0.35, // in the dark theme the river keeps a little of the glazing's reflection
  })
}


// ── the plaza, steps and plastered walls around the stadium: pale, dusty lime-plaster ──
function plaza() {
  return patch(base('stone'), {
    body: /* glsl */ `
      vec3 g; float hgt = grain3(vWP, nW, 0.8, g);
      float fade = 1.0 - smoothstep(50.0, 320.0, camD);
      normal = normalize((viewMatrix * vec4(bumpN(nW, g, 0.06 * fade), 0.0)).xyz);
      nW = inverseTransformDirection(normal, viewMatrix);
      float n = fbm1(vWP.xz * 0.09 + vWP.y * 0.05);
      float top = smoothstep(0.4, 0.85, nW.y);
      vec3 col = mix(vec3(0.60, 0.50, 0.38), vec3(0.74, 0.65, 0.52), smoothstep(0.2, 0.8, n * 0.7 + hgt * 0.4));
      col = mix(col, vec3(0.78, 0.69, 0.56), 0.35 * top);
      col *= layerTint(vcol, 0.45, 0.2);
      diffuseColor.rgb = col;
      roughnessFactor = 0.96;
      float near = exp(-pow(length(vWP.xz) / 320.0, 2.0));
      float side = 1.0 - smoothstep(0.3, 0.72, nW.y);
      glow = uRed * uNight * near * (0.1 + 0.55 * side);
    `,
  })
}

// ── the entrances: dark, deep-set openings in the bowl's skin ────────────────
function doors() {
  return patch(base('doors'), {
    body: /* glsl */ `
      float n = fbm1(vWP.xz * 0.6 + vWP.y * 0.3);
      vec3 col = mix(vec3(0.10, 0.07, 0.05), vec3(0.19, 0.13, 0.09), n);
      diffuseColor.rgb = col;
      roughnessFactor = 0.85;
      // by night a warm light spills out of the entrances
      glow = vec3(1.0, 0.55, 0.28) * uNight * (0.35 + 0.35 * n);
    `,
  })
}

// ── the surrounding blocks of the city: plain earth masses in the haze ───────
function blocks() {
  return patch(base('blocks'), {
    body: /* glsl */ `
      float n = fbm1(vWP.xz * 0.05 + vWP.y * 0.12);
      float top = smoothstep(0.5, 0.9, nW.y);
      vec3 col = mix(vec3(0.50, 0.40, 0.30), vec3(0.66, 0.55, 0.42), n);
      col = mix(col, vec3(0.72, 0.62, 0.48), 0.5 * top);
      diffuseColor.rgb = col;
      roughnessFactor = 1.0;
      float near = exp(-pow(length(vWP.xz) / 520.0, 2.0));
      glow = uRed * uNight * near * 0.1;
    `,
  })
}

export function createMaterials() {
  return {
    roof: clay(), bowl: bowl(), wall: glass(), pitch: pitch(), text: lettering(), ground: ground(), grass: grass(),
    paving: paving(), water: water(), stone: plaza(), doors: doors(), blocks: blocks(),
  }
}

export const SUN_DIR = new Vector3()

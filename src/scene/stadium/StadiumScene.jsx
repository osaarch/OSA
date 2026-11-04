import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  NeutralToneMapping,
  PCFSoftShadowMap,
  ShaderMaterial,
  Vector3,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import '../tonemap'
import Sky from '../Sky'
import Grains from '../Grains'
import Foliage from './Foliage'
import { createMaterials, SU } from './materials'
import { createGrade, gradeAt, sunAzimuth } from './grade'
import { samplePath, ORBIT_START } from './path'
import { CHAPTERS, sj, stadiumLoad, stadiumWorld } from './state'
import { clamp, smoothstep, stepJourney } from '../../journey'
import { audio } from '../../audio'
import { getLang, tNow } from '../../i18n'

const IS_COARSE = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches
const SHADOW_SIZE = IS_COARSE ? 2048 : 4096
const root = typeof document !== 'undefined' ? document.documentElement : null
const STILL = typeof window !== 'undefined' && /[?&]still\b/.test(window.location.search)
const fmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const UP = new Vector3(0, 1, 0)

// ── the model ────────────────────────────────────────────────────────────────
// Built from the project's own Rhino file (STADUAM.3dm): the stadium, its roof planes,
// the bowl, the glazing, the lettering and the site (ground, planting, river, paths).
function StadiumModel({ mats, onGround }) {
  const { gl, camera, scene } = useThree()
  const [group, setGroup] = useState(null)

  useEffect(() => {
    let dead = false
    stadiumLoad.set({ progress: 0, ready: false, error: null })
    ;(async () => {
      try {
        const url = __SINGLE__
          ? (await import('./singleStadium.js')).glbUrl
          : `${import.meta.env.BASE_URL}assets/stadium/stadium.glb`
        const gltf = await new Promise((resolve, reject) =>
          new GLTFLoader().load(
            url,
            resolve,
            (e) => {
              if (e && e.lengthComputable) stadiumLoad.set({ progress: Math.min(0.88, (e.loaded / e.total) * 0.88) })
            },
            reject,
          ),
        )
        if (dead) return
        const g = gltf.scene
        let grassGeo = null
        g.traverse((o) => {
          if (!o.isMesh) return
          const key = o.name
          o.material = mats[key] || mats.ground
          o.castShadow = key === 'roof' || key === 'bowl' || key === 'wall' || key === 'text'
          o.receiveShadow = key !== 'water'
          o.frustumCulled = false
          if (key === 'grass') grassGeo = o.geometry
        })
        stadiumLoad.set({ progress: 0.93 })
        setGroup(g)
        onGround(grassGeo)
        await new Promise((r) => setTimeout(r, 60))
        try {
          await gl.compileAsync(g, camera, scene)
        } catch (e) {
          /* first frame will compile instead */
        }
        if (!dead) stadiumLoad.set({ progress: 1, ready: true })
      } catch (err) {
        console.error('Stadium model failed:', err)
        if (!dead) stadiumLoad.set({ error: String(err && err.message ? err.message : err) })
      }
    })()
    return () => {
      dead = true
    }
  }, [mats, gl, camera, scene, onGround])

  return group ? <primitive object={group} /> : null
}

// ── the ground beyond the model's own site: more of the same earth, lost in the haze ──
function FarGround({ material }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -19, 0]} material={material} frustumCulled={false}>
      <circleGeometry args={[9000, 48]} />
    </mesh>
  )
}

// ── dust floating around the camera ──────────────────────────────────────────
const dustVert = /* glsl */ `
attribute vec2 aPhase;
uniform float uTime; uniform float uScale; uniform vec3 uCam;
varying float vAlpha;
void main(){
  vec3 p = position;
  float B = 900.0;
  p.x += uTime * 3.2; p.z += uTime * 1.1;
  p.x += sin(uTime * 0.17 + aPhase.x * 6.283) * 6.0;
  p.y += sin(uTime * 0.23 + aPhase.x * 11.0) * 3.0;
  p = mod(p - uCam + B * 0.5, B) - B * 0.5 + uCam;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float dist = -mv.z;
  gl_PointSize = clamp(1.6 * aPhase.y * uScale / max(dist, 0.1), 0.0, 12.0);
  vAlpha = (1.0 - smoothstep(180.0, 440.0, dist)) * smoothstep(6.0, 40.0, dist) * smoothstep(-15.0, 45.0, p.y);
  gl_Position = projectionMatrix * mv;
}`
const dustFrag = /* glsl */ `
uniform vec3 uColor; uniform float uOpacity;
varying float vAlpha;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d); a *= a;
  gl_FragColor = vec4(uColor, a * vAlpha * uOpacity);
}`
function StadiumDust({ materialRef, count = 2600 }) {
  const geometry = useMemo(() => {
    const g = new BufferGeometry()
    const pos = new Float32Array(count * 3)
    const ph = new Float32Array(count * 2)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 900
      pos[i * 3 + 1] = Math.pow(Math.random(), 1.5) * 380
      pos[i * 3 + 2] = (Math.random() - 0.5) * 900
      ph[i * 2] = Math.random()
      ph[i * 2 + 1] = 0.5 + Math.random() * 1.2
    }
    g.setAttribute('position', new BufferAttribute(pos, 3))
    g.setAttribute('aPhase', new BufferAttribute(ph, 2))
    return g
  }, [count])
  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        fog: false,
        toneMapped: false,
        uniforms: {
          uTime: { value: 0 },
          uScale: { value: 900 },
          uCam: { value: new Vector3() },
          uColor: { value: new Color('#ffe0b0') },
          uOpacity: { value: 0.3 },
        },
        vertexShader: dustVert,
        fragmentShader: dustFrag,
      }),
    [],
  )
  if (materialRef) materialRef.current = material
  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={5} />
}

// ── lights ───────────────────────────────────────────────────────────────────
function Lights({ sunRef, hemiRef, fillRef }) {
  useLayoutEffect(() => {
    const sun = sunRef.current
    const cam = sun.shadow.camera
    cam.left = -330
    cam.right = 330
    cam.top = 330
    cam.bottom = -330
    cam.near = 50
    cam.far = 1900
    cam.updateProjectionMatrix()
    sun.shadow.mapSize.set(SHADOW_SIZE, SHADOW_SIZE)
    sun.shadow.bias = -0.0004
    sun.shadow.normalBias = 0.35
  }, [sunRef])
  return (
    <>
      <directionalLight ref={sunRef} castShadow intensity={3} color="#ffd9a0" />
      <hemisphereLight ref={hemiRef} intensity={0.8} />
      <directionalLight ref={fillRef} intensity={0.3} color="#e8c9a0" />
    </>
  )
}

// ── one component owns the frame: spring → grade → camera (+ mouse) → world → render ──
function Rig({ grade, refs }) {
  const { sunRef, hemiRef, fillRef, fogRef, skyMesh, skyMat, dustMat, grainMesh, grainMat } = refs
  const { camera, size, setDpr, gl, scene } = useThree()
  const P = useMemo(() => ({}), [])
  const v = useMemo(() => ({ sun: new Vector3(), f: new Vector3(), r: new Vector3() }), [])
  const st = useRef({
    mx: 0, my: 0, px: 0, py: 0, cx: 2, cy: 2, vx: 0, vy: 0, has: false,
    hudT: 0, audioT: 0, cheered: false, chap: -1, lang: '',
    dprAvg: 0.016, dprN: 0, dpr: gl.getPixelRatio(), dprMax: gl.getPixelRatio(),
  }).current

  useEffect(() => {
    const onMove = (e) => {
      st.mx = (e.clientX / window.innerWidth) * 2 - 1
      st.my = (e.clientY / window.innerHeight) * 2 - 1
      if (!st.has) {
        st.has = true
        st.cx = st.mx
        st.cy = -st.my
        st.vx = st.vy = 0
      }
    }
    const onLeave = () => {
      st.has = false
      st.cx = st.cy = 2
      st.vx = st.vy = 0
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [st])

  useEffect(() => {
    stadiumWorld.forceFrames = 4
  }, [size.width, size.height])

  useFrame(({ clock }, dtRaw) => {
    if (!stadiumWorld.active || !stadiumLoad.get().ready) return
    const dt = Math.min(dtRaw, 0.1)
    const t = clock.elapsedTime

    const moved = stepJourney(dt, 7.4, sj)
    const u = sj.current
    gradeAt(u, grade)

    // soundtrack: a stadium filling up — a far-off murmur and the sand at first, then stomps,
    // clapping, a roaring crowd and brass over the bowl, a whistle as the stands light up, and
    // finally only the music; the wind and the falling sand stay under all of it
    st.audioT += dt
    if (st.audioT > 0.12) {
      st.audioT = 0
      const live = 1 - grade.black
      audio.setScene({
        wind: (0.15 + 0.3 * grade.dust) * (1 - 0.3 * smoothstep(0.55, 0.9, u)) * live,
        music: 0.62 + 0.38 * smoothstep(0, 0.3, u),
        clarity: 1,
        pulse: 0.1 + 0.7 * smoothstep(0.3, 0.8, u) * live + 0.3 * grade.black,
        crowd: (0.1 + 0.5 * smoothstep(0.1, 0.62, u) + 0.3 * smoothstep(0.62, 0.86, u)) * (1 - 0.8 * grade.black),
        drive: smoothstep(0.26, 0.8, u) * (1 - 0.4 * grade.black),
      })
      // the whistle and the roar, once, as the camera reaches the full stands
      if (u > 0.78 && !st.cheered) {
        st.cheered = true
        audio.cheer()
      } else if (u < 0.66) st.cheered = false
    }

    const settledBlack = u >= 0.9995 && sj.target >= 0.9995 && !moved
    if (settledBlack && stadiumWorld.forceFrames <= 0) return
    // tests on a software renderer (?still): draw only when something changed
    if (STILL && !moved && stadiumWorld.forceFrames <= 0) return

    // pointer: smoothed parallax + a fast "cursor wind"
    st.px += (st.mx - st.px) * (1 - Math.exp(-dt * 3.0))
    st.py += (st.my - st.py) * (1 - Math.exp(-dt * 3.0))
    if (st.has) {
      const kc = 1 - Math.exp(-dt * 16)
      const ncx = st.cx + (st.mx - st.cx) * kc
      const ncy = st.cy + (-st.my - st.cy) * kc
      const k = 1 - Math.exp(-dt * 9)
      st.vx += ((ncx - st.cx) / dt - st.vx) * k
      st.vy += ((ncy - st.cy) / dt - st.vy) * k
      st.cx = ncx
      st.cy = ncy
    } else {
      st.vx *= 0.9
      st.vy *= 0.9
    }
    let vlen = Math.hypot(st.vx, st.vy)
    const vclamp = vlen > 1.0 ? 1.0 / vlen : 1
    vlen = Math.min(vlen, 1.0)

    // camera
    samplePath(u, P)
    const pm = 1 - smoothstep(0.7, 0.86, u)
    const yaw = (st.px * 0.06 + Math.sin(t * 0.21) * 0.005) * pm
    const pitch = (st.py * 0.035 + Math.sin(t * 0.17 + 1) * 0.004) * pm
    const rx = Math.cos(P.theta)
    const rz = -Math.sin(P.theta)
    camera.position.set(
      P.x + rx * st.px * 0.012 * P.r * pm,
      P.y - st.py * 0.006 * P.r * pm,
      P.z + rz * st.px * 0.012 * P.r * pm,
    )
    v.f.set(0, P.ty, 0).sub(camera.position)
    v.f.applyAxisAngle(UP, -yaw)
    v.r.crossVectors(v.f, UP).normalize()
    v.f.applyAxisAngle(v.r, -pitch)
    camera.lookAt(camera.position.x + v.f.x, camera.position.y + v.f.y, camera.position.z + v.f.z)
    camera.fov = P.fov
    const dist = camera.position.length()
    camera.near = clamp(dist * 0.03, 0.5, 30)
    camera.far = 9500
    camera.updateProjectionMatrix()

    // world
    const el = grade.sunElevation
    const ce = Math.cos(el)
    const az = sunAzimuth(P.theta, u)
    v.sun.set(ce * Math.sin(az), Math.sin(el), ce * Math.cos(az))
    const sun = sunRef.current
    sun.position.copy(v.sun).multiplyScalar(800)
    sun.position.y += 20
    sun.color.copy(grade.sunColor)
    sun.intensity = grade.sunIntensity
    sun.target.position.set(0, 20, 0)
    sun.target.updateMatrixWorld()

    const hemi = hemiRef.current
    hemi.color.copy(grade.hemiSky)
    hemi.groundColor.copy(grade.hemiGround)
    hemi.intensity = grade.hemiIntensity

    const fill = fillRef.current
    fill.position.set(-v.sun.x * 300, 140, -v.sun.z * 300)
    fill.intensity = grade.fillIntensity

    const fog = fogRef.current
    fog.color.copy(grade.fog)
    fog.density = grade.fogDensity

    skyMesh.current.position.copy(camera.position)
    const sm = skyMat.current.uniforms
    sm.uHorizon.value.copy(grade.skyHorizon)
    sm.uZenith.value.copy(grade.skyZenith)
    sm.uSunCol.value.copy(grade.sunColor)
    sm.uSunDir.value.copy(v.sun)
    sm.uGlow.value = grade.glow

    SU.uTime.value = t
    SU.uNight.value = grade.redLight
    SU.uCrowd.value = grade.crowd
    SU.uBlack.value = grade.black
    SU.uSkyH.value.copy(grade.skyHorizon)
    SU.uSkyZ.value.copy(grade.skyZenith)

    const w = size.width
    const h = size.height
    const dm = dustMat.current.uniforms
    dm.uTime.value = t
    dm.uScale.value = (h * gl.getPixelRatio() * 0.5) / Math.tan((P.fov * Math.PI) / 360)
    dm.uCam.value.copy(camera.position)
    dm.uColor.value.copy(grade.sunColor)
    dm.uOpacity.value = 0.34 * grade.dust * clamp(grade.sunIntensity / 2.5, 0, 1)

    const grainAmp = 0.7 * grade.dust
    grainMesh.current.visible = grainAmp > 0.01
    if (grainMesh.current.visible) {
      const gu = grainMat.current.uniforms
      gu.uTime.value = t
      gu.uAspect.value = w / h
      gu.uPx.value = gl.getPixelRatio()
      gu.uStorm.value = 0
      gu.uAmp.value = grainAmp
      gu.uMouse.value.set(st.cx, st.cy)
      gu.uMouseVel.value.set(st.vx * vclamp, st.vy * vclamp)
      gu.uParallax.value.set(st.px, -st.py)
      gu.uDark.value.set('#8f7650').lerp(gu.uLight.value, grade.night)
    }

    // DOM overlays (CSS variables, no React)
    if (moved || stadiumWorld.forceFrames > 0) {
      root.style.setProperty('--pj', u.toFixed(4))
      root.style.setProperty('--pj-black', grade.black.toFixed(4))
      root.style.setProperty('--pj-logo', smoothstep(0.972, 1.0, u).toFixed(3))
      root.style.setProperty('--pj-hud', (1 - smoothstep(0.9, 0.968, u)).toFixed(3))
      root.style.setProperty('--pj-ink', u > 0.46 ? '1' : '0')
    }
    st.hudT += dt
    if (st.hudT > 0.06) {
      st.hudT = 0
      const set = (id, tx) => {
        const e = document.getElementById(id)
        if (e && e.textContent !== tx) e.textContent = tx
      }
      let deg = ((P.theta * 180) / Math.PI) % 360
      if (deg < 0) deg += 360
      const unit = tNow().unit
      set('pj-dist', `${fmt.format(Math.hypot(camera.position.x, camera.position.z))} ${unit}`)
      set('pj-alt', `${fmt.format(camera.position.y)} ${unit}`)
      set('pj-brg', `${String(Math.round(deg) % 360).padStart(3, '0')}°`)
      const ci = Math.max(0, CHAPTERS.findIndex((c) => u >= c.from && u < c.to))
      if (ci !== st.chap || st.lang !== getLang()) {
        st.chap = ci
        st.lang = getLang()
        set('pj-chap-n', CHAPTERS[ci].n)
        set('pj-chap-t', tNow().chapters[ci])
      }
    }

    // adaptive resolution: protect the frame rate on weaker GPUs
    st.dprAvg += (dt - st.dprAvg) * 0.04
    st.dprN++
    if (st.dprN > 90) {
      st.dprN = 0
      if (st.dprAvg > 0.032 && st.dpr > 0.85) {
        st.dpr = Math.max(0.85, st.dpr - 0.25)
        setDpr(st.dpr)
      } else if (st.dprAvg < 0.0175 && st.dpr < st.dprMax) {
        st.dpr = Math.min(st.dprMax, st.dpr + 0.25)
        setDpr(st.dpr)
      }
    }

    if (stadiumWorld.forceFrames > 0) stadiumWorld.forceFrames--
    const r0 = STILL ? performance.now() : 0
    gl.render(scene, camera)
    if (STILL && window.__stadium) window.__stadium.frameMs = performance.now() - r0
  }, 1)

  return null
}

export default function StadiumScene() {
  const refs = {
    sunRef: useRef(),
    hemiRef: useRef(),
    fillRef: useRef(),
    fogRef: useRef(),
    skyMesh: useRef(),
    skyMat: useRef(),
    dustMat: useRef(),
    grainMesh: useRef(),
    grainMat: useRef(),
  }
  const grade = useMemo(() => createGrade(), [])
  const mats = useMemo(() => createMaterials(), [])
  const [grassGeo, setGrassGeo] = useState(null)
  const start = useMemo(() => {
    const p = {}
    samplePath(0, p)
    return [p.x, p.y, p.z]
  }, [])

  return (
    <Canvas
      className="stage stage-project"
      shadows
      dpr={[1, Math.min(2, typeof devicePixelRatio === 'number' ? devicePixelRatio : 1)]}
      camera={{ fov: 24, near: 10, far: 9500, position: start }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', stencil: false }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor('#000000')
        gl.toneMapping = NeutralToneMapping
        gl.toneMappingExposure = 1
        gl.shadowMap.type = PCFSoftShadowMap
        scene.background = null
        if (typeof window !== 'undefined' && /[?&]debug\b/.test(window.location.search))
          window.__stadium = { gl, scene, THREE, sj, samplePath, ORBIT_START, world: stadiumWorld, load: stadiumLoad }
      }}
    >
      <fogExp2 ref={refs.fogRef} attach="fog" args={['#e9d2a8', 0.0004]} />
      <Sky meshRef={refs.skyMesh} materialRef={refs.skyMat} />
      <Lights sunRef={refs.sunRef} hemiRef={refs.hemiRef} fillRef={refs.fillRef} />
      <FarGround material={mats.ground} />
      <StadiumDust materialRef={refs.dustMat} />
      <StadiumModel mats={mats} onGround={setGrassGeo} />
      <Foliage groundGeometry={grassGeo} />
      <Grains meshRef={refs.grainMesh} materialRef={refs.grainMat} />
      <Rig grade={grade} refs={refs} />
    </Canvas>
  )
}

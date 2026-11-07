import { tNow } from '../i18n'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Color, NeutralToneMapping, PCFSoftShadowMap, ShaderChunk, Vector3 } from 'three'
import Malwiya from './Malwiya'
import Ground, { groundUniforms } from './Ground'
import Sky from './Sky'
import Dust from './Dust'
import Veil from './Veil'
import Grains from './Grains'
import { createGrade, gradeAt, sunAzimuth } from './grade'
import { dark, setRainZone, stepNight, themeBusy } from '../night'
import { samplePath, lensShift } from './path'
import { duskUniforms, INTRO_LEN, loadState, world } from './world'
import { clamp, journey, readScrollProgress, smootherstep, smoothstep, stepJourney } from '../journey'
import { audio, homeMood } from '../audio'

// Khronos "Neutral" tone mapping subtracts the darkest colour channel from dark pixels,
// which turns every dim beige into saturated mustard. Soften that toe so dark tones keep
// their hue and the fade to black stays a warm, neutral earth colour.
ShaderChunk.tonemapping_pars_fragment = ShaderChunk.tonemapping_pars_fragment.replace(
  'float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;',
  'float offset = 0.04 * smoothstep( 0.0, 0.16, x );',
)

const IS_COARSE = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches
const SHADOW_SIZE = IS_COARSE ? 2048 : 4096
const root = typeof document !== 'undefined' ? document.documentElement : null

const GRAIN_DARK_LIGHT = new Color('#d29c66') // in the dark theme the specks are earth-amber
const fmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const UP = new Vector3(0, 1, 0)

function Lights({ sunRef, hemiRef, fillRef }) {
  useLayoutEffect(() => {
    const sun = sunRef.current
    const cam = sun.shadow.camera
    cam.left = -125
    cam.right = 125
    cam.top = 125
    cam.bottom = -125
    cam.near = 20
    cam.far = 900
    cam.updateProjectionMatrix()
    sun.shadow.mapSize.set(SHADOW_SIZE, SHADOW_SIZE)
    sun.shadow.bias = -0.00035
    sun.shadow.normalBias = 0.05
  }, [sunRef])
  return (
    <>
      <directionalLight ref={sunRef} castShadow intensity={3} color="#fff0d4" />
      <hemisphereLight ref={hemiRef} intensity={0.8} />
      <directionalLight ref={fillRef} intensity={0.3} color="#f1dfc0" />
    </>
  )
}

// One component owns the whole frame so the order is explicit:
//   intro clock → scroll spring → colour grade → camera (+ mouse) → lights/sky/fog
//   → storm veil & sand grains → DOM variables → audio → render
function Rig({ grade, refs }) {
  const { sunRef, hemiRef, fillRef, fogRef, skyMesh, skyMat, groundMat, dustMat, veilMesh, veilMat, grainMesh, grainMat } =
    refs
  const { camera, size, setDpr, gl, scene } = useThree()
  const P = useMemo(() => ({}), [])
  const v = useMemo(() => ({ sun: new Vector3(), fill: new Vector3(), f: new Vector3(), r: new Vector3() }), [])
  const st = useRef({
    // pointer: raw (NDC, y down), smoothed for parallax, and a fast "cursor wind" with velocity
    mx: 0,
    my: 0,
    px: 0,
    py: 0,
    cx: 2,
    cy: 2,
    vx: 0,
    vy: 0,
    has: false,
    live: null,
    hudT: 0,
    audioT: 0,
    dprAvg: 0.016,
    dprN: 0,
    dpr: gl.getPixelRatio(),
    dprMax: gl.getPixelRatio(),
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
    // any input during the teaser fast-forwards it
    const skip = () => {
      if (world.introStarted && !world.introDone) world.introSkip = true
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    for (const ev of ['wheel', 'touchstart', 'keydown', 'pointerdown']) window.addEventListener(ev, skip, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      for (const ev of ['wheel', 'touchstart', 'keydown', 'pointerdown']) window.removeEventListener(ev, skip)
    }
  }, [st])

  useEffect(() => {
    world.forceFrames = 4
  }, [size.width, size.height])

  useFrame(({ clock }, dtRaw) => {
    if (world.paused) return
    const dt = Math.min(dtRaw, 0.1)
    const t = clock.elapsedTime

    // ── 0. the intro clock (starts when the visitor chooses to enter) ───────
    if (!world.introDone && world.introStarted && loadState.get().ready && !world.introFreeze) {
      world.introT += dt * (world.introSkip ? 6 : 1)
      if (world.introT >= INTRO_LEN) {
        world.introDone = true
        root.classList.remove('is-intro', 'is-started')
        root.style.setProperty('--intro-text', '0')
        root.style.setProperty('--hud-in', '1')
        journey.target = readScrollProgress()
      }
    }
    // while the visitor is still choosing, just hold the first frame
    if (!world.introDone && !world.introStarted && world.forceFrames <= 0) return

    const it = world.introDone ? INTRO_LEN : world.introT
    const storm = world.introDone ? 0 : 1 - smootherstep(1.5, 6.4, it) // 1 → 0
    if (!world.introDone) journey.target = 0 // the journey waits for the dust to clear

    const moved = stepJourney(dt) || themeBusy()
    const nm = stepNight()
    const dk = dark.v
    const u = journey.current
    const settledBlack = u >= 0.9995 && journey.target >= 0.9995 && !moved
    if (settledBlack && world.forceFrames <= 0) return

    // ── 1. colour script ────────────────────────────────────────────────────
    gradeAt(u, grade, nm, dk)

    // ── 2. pointer: smoothed parallax + a fast "cursor wind" with velocity ──
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

    // ── 3. camera ───────────────────────────────────────────────────────────
    samplePath(u, P)
    // pre-roll: the camera starts further back and drifts in while the dust clears
    const pre = world.introDone ? 0 : 1 - smootherstep(0, INTRO_LEN, it)
    P.x *= 1 + 0.4 * pre
    P.z *= 1 + 0.4 * pre
    P.y *= 1 + 0.25 * pre
    // the monument follows the mouse: a gentle tilt + parallax (and a slow idle sway)
    const pm = 1 - smoothstep(0.9, 0.995, u)
    const yaw = (st.px * 0.07 + Math.sin(t * 0.21) * 0.006) * pm
    const pitch = (st.py * 0.04 + Math.sin(t * 0.17 + 1) * 0.004) * pm
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
    camera.near = clamp(dist * 0.035, 0.4, 36)
    camera.far = 9000
    const shift = lensShift(u)
    const w = size.width
    const h = size.height
    if (shift > 0.0005) {
      if (w >= h) camera.setViewOffset(w, h, -shift * w * 0.2, 0, w, h)
      else camera.setViewOffset(w, h, 0, shift * h * 0.17, w, h)
    } else if (camera.view && camera.view.enabled) camera.clearViewOffset()
    camera.updateProjectionMatrix()

    // ── 4. world ────────────────────────────────────────────────────────────
    const el = grade.sunElevation
    const ce = Math.cos(el)
    // by day the sun travels across the sky; in the dark theme the one warm light stays at a fixed angle
    // to the camera, so the monument is always lit from the side, whichever way the camera has gone round
    const az = sunAzimuth(u) * (1 - dk) + (P.theta + 0.95) * dk
    v.sun.set(ce * Math.sin(az), Math.sin(el), ce * Math.cos(az))
    const sun = sunRef.current
    sun.position.copy(v.sun).multiplyScalar(430)
    sun.color.copy(grade.sunColor)
    sun.intensity = grade.sunIntensity
    sun.target.position.set(0, 0, 0)
    sun.target.updateMatrixWorld()

    const hemi = hemiRef.current
    hemi.color.copy(grade.hemiSky)
    hemi.groundColor.copy(grade.hemiGround)
    hemi.intensity = grade.hemiIntensity

    const fill = fillRef.current
    fill.position.set(-v.sun.x * 300, 140, -v.sun.z * 300)
    fill.intensity = grade.fillIntensity

    // the storm thickens the whole atmosphere
    const fog = fogRef.current
    fog.color.copy(grade.fog)
    fog.density = grade.fogDensity * (1 + 1.3 * storm * storm)

    skyMesh.current.position.copy(camera.position)
    const sm = skyMat.current.uniforms
    sm.uHorizon.value.copy(grade.skyHorizon)
    sm.uZenith.value.copy(grade.skyZenith)
    sm.uSunCol.value.copy(grade.sunColor)
    sm.uSunDir.value.copy(v.sun)
    sm.uGlow.value = grade.glow

    groundMat.current.color.copy(grade.ground)
    groundUniforms.uSpec.value = 1 - dk

    duskUniforms.uDuskMix.value = grade.duskMix
    duskUniforms.uTermY.value = grade.termY

    const dm = dustMat.current.uniforms
    dm.uTime.value = t
    dm.uScale.value = (h * gl.getPixelRatio() * 0.5) / Math.tan((P.fov * Math.PI) / 360)
    dm.uColor.value.copy(grade.sunColor)
    dm.uOpacity.value = 0.3 * grade.dust * clamp(grade.sunIntensity / 2.5, 0, 1)

    // ── 5. storm veil + sand grains (both react to the cursor) ──────────────
    const inkL = Math.max(smoothstep(0.645, 0.69, u), nm, dk)
    veilMesh.current.visible = storm > 0.012
    if (veilMesh.current.visible) {
      const vu = veilMat.current.uniforms
      vu.uTime.value = t
      vu.uStorm.value = storm
      vu.uAspect.value = w / h
      vu.uActive.value = st.has ? 1 : 0
      vu.uMouse.value.set(st.cx * 0.5 + 0.5, st.cy * 0.5 + 0.5)
      vu.uMouseVel.value.set(st.vx * 0.5 * vclamp, st.vy * 0.5 * vclamp)
      vu.uColor.value.copy(grade.fog).multiplyScalar(1.04)
    }
    const grainAmp = (0.8 + 0.6 * storm) * grade.dust * (1 - 0.65 * dk)
    grainMesh.current.visible = grainAmp > 0.01
    if (grainMesh.current.visible) {
      const gu = grainMat.current.uniforms
      gu.uTime.value = t
      gu.uAspect.value = w / h
      gu.uPx.value = gl.getPixelRatio()
      gu.uStorm.value = storm
      gu.uAmp.value = grainAmp
      gu.uMouse.value.set(st.cx, st.cy)
      gu.uMouseVel.value.set(st.vx * vclamp, st.vy * vclamp)
      gu.uParallax.value.set(st.px, -st.py)
      gu.uLight.value.set('#f3e4c2').lerp(GRAIN_DARK_LIGHT, dk)
      gu.uDark.value.set('#8f7650').lerp(gu.uLight.value, inkL)
    }

    // ── 6. DOM overlays (CSS variables, no React) ───────────────────────────
    const menu = smoothstep(0.865, 0.985, u)
    const intro = 1 - smoothstep(0.0, 0.055, u)
    const black = smoothstep(0.94, 0.997, u)
    setRainZone(1 - black) // night rain only falls during the journey, not on the black menu screen
    if (moved || world.forceFrames > 0) {
      root.style.setProperty('--p', u.toFixed(4))
      root.style.setProperty('--menu', menu.toFixed(4))
      root.style.setProperty('--intro', intro.toFixed(4))
      root.style.setProperty('--black', black.toFixed(4))
      root.style.setProperty('--dusk', grade.dusk.toFixed(3))
      // HUD ink crosses from dark (on beige) to light (on the darkening sky) in one dimmed beat
      root.style.setProperty('--ink-l', inkL.toFixed(3))
      root.style.setProperty('--hud-a', (1 - 0.72 * smoothstep(0.05, 0.0, Math.abs(u - 0.667))).toFixed(3))
    }
    if (!world.introDone) {
      const txt = smoothstep(0.5, 1.7, it) * (1 - smoothstep(3.9, 5.2, it))
      root.style.setProperty('--intro-text', txt.toFixed(3))
      root.style.setProperty('--hud-in', smoothstep(5.8, 6.9, it).toFixed(3))
    }
    const live = menu > 0.9
    if (live !== st.live) {
      st.live = live
      root.dataset.menu = live ? 'live' : 'off'
    }
    st.hudT += dt
    if (st.hudT > 0.06) {
      st.hudT = 0
      const set = (id, tx) => {
        const el2 = document.getElementById(id)
        if (el2 && el2.textContent !== tx) el2.textContent = tx
      }
      const d = Math.hypot(camera.position.x, camera.position.y - 24, camera.position.z)
      let deg = ((P.theta * 180) / Math.PI) % 360
      if (deg < 0) deg += 360
      set('hud-dist', `${fmt.format(d)} ${tNow().unit}`)
      set('hud-alt', `${fmt.format(camera.position.y)} ${tNow().unit}`)
      set('hud-brg', `${String(Math.round(deg) % 360).padStart(3, '0')}°`)
    }

    // ── 7. soundtrack follows the scene: wind + sand while there is dust,
    //       only music once the dust is gone (the OSA / WORKS screen) ────────
    st.audioT += dt
    if (st.audioT > 0.12) {
      st.audioT = 0
      const breeze = 0.3 * grade.dust
      const scene = {
        wind: breeze + storm * (1 - breeze),
        music: 0.4 + 0.6 * (1 - storm),
        clarity: 1 - 0.85 * storm,
      }
      if (homeMood() === 'odyssey') {
        // the score follows the journey: silence in the dust, the oars waking as the visitor starts to
        // scroll, the peak around the dusk (u ≈ 0.55–0.7), then the percussion withdraws into the black
        const go = world.introDone ? 1 : 0
        const climb = smoothstep(0.03, 0.5, u)
        const fall = 1 - 0.55 * smoothstep(0.72, 0.93, u)
        scene.pulse = go * climb * (1 - 0.3 * smoothstep(0.72, 0.93, u))
        scene.drive = go * smoothstep(0.22, 0.62, u) * fall
        scene.end = black
      }
      audio.setScene(scene)
    }

    // ── 8. adaptive resolution: protect the frame rate on weaker GPUs ───────
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

    // ── 9. render ───────────────────────────────────────────────────────────
    if (world.forceFrames > 0) world.forceFrames--
    gl.render(scene, camera)
  }, 1)

  return null
}

export default function Scene() {
  const refs = {
    sunRef: useRef(),
    hemiRef: useRef(),
    fillRef: useRef(),
    fogRef: useRef(),
    skyMesh: useRef(),
    skyMat: useRef(),
    groundMat: useRef(),
    dustMat: useRef(),
    veilMesh: useRef(),
    veilMat: useRef(),
    grainMesh: useRef(),
    grainMat: useRef(),
  }
  const grade = useMemo(() => createGrade(), [])

  return (
    <Canvas
      className="stage"
      shadows
      dpr={[1, Math.min(2, typeof devicePixelRatio === 'number' ? devicePixelRatio : 1)]}
      camera={{ fov: 24, near: 1, far: 9000, position: [-700, 128, 1000] }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', stencil: false }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor('#000000')
        gl.toneMapping = NeutralToneMapping
        gl.toneMappingExposure = 1
        gl.shadowMap.type = PCFSoftShadowMap
        scene.background = null
        if (typeof window !== 'undefined' && /[?&]debug\b/.test(window.location.search))
          window.__three = { gl, scene, THREE, path: { samplePath, lensShift } }
      }}
    >
      <fogExp2 ref={refs.fogRef} attach="fog" args={['#e9d9bb', 0.0006]} />
      <Sky meshRef={refs.skyMesh} materialRef={refs.skyMat} />
      <Lights sunRef={refs.sunRef} hemiRef={refs.hemiRef} fillRef={refs.fillRef} />
      <Ground materialRef={refs.groundMat} />
      <Dust materialRef={refs.dustMat} />
      <Malwiya />
      <Grains meshRef={refs.grainMesh} materialRef={refs.grainMat} />
      <Veil meshRef={refs.veilMesh} materialRef={refs.veilMat} />
      <Rig grade={grade} refs={refs} />
    </Canvas>
  )
}

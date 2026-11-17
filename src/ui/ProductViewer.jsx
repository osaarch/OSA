import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, useGLTF, useProgress } from '@react-three/drei'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// A small 3D object, like a piece shown for sale: no backdrop and no floor, only the model on the page's
// own black. Drag to turn it; until the first touch it sways gently so it is clearly alive.
// The materials are set here by the model's part names (steps / wings / arch) and lit by a studio of soft
// light panels, so it reads as a render: satin gold wings, a white satin arch, a black high-gloss base.

const MATS = {
  // high-gloss black acrylic: mostly reflections of the studio's light panels
  steps: () =>
    new THREE.MeshPhysicalMaterial({ color: '#050506', roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 0.7, ior: 1.5 }),
  // satin champagne gold
  wings: () =>
    new THREE.MeshStandardMaterial({ color: '#dcb66a', roughness: 0.34, metalness: 1, envMapIntensity: 1.25, side: THREE.DoubleSide }),
  // white, slightly satin
  arch: () =>
    new THREE.MeshPhysicalMaterial({ color: '#e6e2d8', roughness: 0.5, metalness: 0, sheen: 0.4, sheenRoughness: 0.5, sheenColor: new THREE.Color('#ffffff'), side: THREE.DoubleSide, envMapIntensity: 0.4 }),
}

// Each panel of the model is its own part ("arch-13", "wings-6" …). Panels that sit deeper are a little
// darker, so the layers read even from the front.
const FRONT = 0.02 // z of the front-most panel
function Model({ url }) {
  const { scene } = useGLTF(url, false)
  const root = useMemo(() => {
    const g = scene.clone(true)
    g.traverse((o) => {
      if (!o.isMesh) return
      const kind = o.name.split('-')[0]
      // the file carries no normals: make them, keeping the crisp edge between a face and its side
      o.geometry.deleteAttribute('color')
      o.geometry = toCreasedNormals(o.geometry, Math.PI / 5)
      const m = (MATS[kind] || MATS.arch)()
      if (kind === 'arch' || kind === 'wings') {
        o.geometry.computeBoundingBox()
        const depth = Math.max(0, FRONT - o.geometry.boundingBox.max.z)
        m.color.multiplyScalar(1 - Math.min(0.22, depth * 0.42))
      }
      o.material = m
      o.castShadow = o.receiveShadow = true
    })
    return g
  }, [scene])
  return <primitive object={root} />
}

// the studio: soft panels above, left, right and behind, and a dim bounce from below so that the
// upright faces have something to reflect
function Studio() {
  return (
    <Environment resolution={256}>
      <color attach="background" args={['#000000']} />
      <Lightformer form="rect" intensity={3.4} position={[0, 8, 2]} scale={[16, 10, 1]} />
      <Lightformer form="rect" intensity={2.4} position={[-9, 3, 6]} scale={[9, 8, 1]} />
      <Lightformer form="rect" intensity={1.8} position={[9, 3, 6]} scale={[9, 8, 1]} />
      <Lightformer form="rect" intensity={2.8} position={[0, 3, -10]} scale={[18, 6, 1]} />
      <Lightformer form="rect" intensity={1.4} position={[0, 5, 11]} scale={[12, 5, 1]} />
      <Lightformer form="rect" intensity={0.8} position={[0, -7, 4]} scale={[20, 14, 1]} />
    </Environment>
  )
}

// camera: a fixed distance that always fits the object, whatever the shape of the frame
const TARGET = new THREE.Vector3(0, 1.95, 0)
function Rig({ idle, onTouch }) {
  const { camera, gl, size } = useThree()
  const ctl = useRef(null)
  useEffect(() => {
    const c = new OrbitControls(camera, gl.domElement)
    c.enablePan = false
    c.enableZoom = false
    c.enableDamping = true
    c.dampingFactor = 0.08
    c.rotateSpeed = 0.7
    c.minPolarAngle = 0.3
    c.maxPolarAngle = Math.PI * 0.53
    c.target.copy(TARGET)
    gl.domElement.style.touchAction = 'pan-y' // a vertical swipe still scrolls the page on a phone
    c.addEventListener('start', onTouch)
    ctl.current = c
    return () => {
      c.removeEventListener('start', onTouch)
      c.dispose()
    }
  }, [camera, gl, onTouch])

  useFrame(({ clock }) => {
    const c = ctl.current
    if (!c) return
    const aspect = size.width / size.height
    const fov = (camera.fov * Math.PI) / 180
    const dH = 2.75 / Math.tan(fov / 2) // half the object's height (+ air)
    const dW = 4.6 / (Math.tan(fov / 2) * aspect) // half its width (+ air)
    const dist = Math.max(dH, dW) + 2
    if (!c.__init) {
      c.__init = true
      camera.position.set(0, TARGET.y + dist * 0.3, dist * 0.95)
    }
    const off = camera.position.clone().sub(c.target)
    off.setLength(dist)
    camera.position.copy(c.target).add(off)
    if (idle.current) {
      const a = Math.sin(clock.elapsedTime * 0.45) * 0.6
      const r = Math.hypot(off.x, off.z)
      camera.position.x = c.target.x + Math.sin(a) * r
      camera.position.z = c.target.z + Math.cos(a) * r
    }
    c.update()
  })
  return null
}

function Load() {
  const { active, progress } = useProgress()
  return (
    <div className={`pv-load${active ? '' : ' is-done'}`} aria-hidden="true">
      <i style={{ transform: `scaleX(${Math.max(0.03, progress / 100)})` }} />
    </div>
  )
}

export default function ProductViewer({ url, label }) {
  const idle = useRef(!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  const [visible, setVisible] = useState(true)
  const wrap = useRef(null)
  const onTouch = useMemo(
    () => () => {
      idle.current = false
    },
    [],
  )

  useEffect(() => {
    const el = wrap.current
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.02 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div className="pv" ref={wrap} role="img" aria-label={label}>
      <Canvas
        className="pv-canvas"
        frameloop={visible ? 'always' : 'never'}
        dpr={[1, 1.75]}
        camera={{ fov: 30, near: 0.1, far: 80, position: [0, 4, 16] }}
        shadows="soft"
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(0x000000, 0)
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 0.95
          if (/[?&]debug\b/.test(window.location.search)) window.__pv = { gl, scene }
        }}
      >
        <Studio />
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[-5, 8, 7]}
          intensity={2.4}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-radius={4}
          shadow-bias={-0.0004}
          shadow-normalBias={0.02}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={7}
          shadow-camera-bottom={-2}
          shadow-camera-near={1}
          shadow-camera-far={30}
        />
        <directionalLight position={[3, 5, -8]} intensity={2} color="#fff0dc" />
        <Suspense fallback={null}>
          <Model url={url} />
        </Suspense>
        <Rig idle={idle} onTouch={onTouch} />
      </Canvas>
      <Load />
    </div>
  )
}

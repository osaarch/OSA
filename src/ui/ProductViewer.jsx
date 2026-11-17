import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, useProgress } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// A bare 3D object, like a piece shown for sale: no backdrop, no floor, no text — only the model on the
// page's own black. Drag to turn it; until the first touch it sways gently so it is clearly alive.
// Materials are set here by the model's part names (steps / wings / arch / letters) so they suit the site:
// a graphite base that still catches light against black, gold wings, a white arch.

const MATS = {
  // glossy black acrylic: it is mostly reflections, so the studio's light panels draw its edges against the page
  steps: () =>
    new THREE.MeshPhysicalMaterial({ color: '#2c2c31', roughness: 0.2, metalness: 0.0, clearcoat: 0.6, clearcoatRoughness: 0.1, envMapIntensity: 2 }),
  // gold with a warm glow, like the render
  wings: () =>
    new THREE.MeshPhysicalMaterial({
      color: '#f0c46a',
      roughness: 0.3,
      metalness: 0.1,
      clearcoat: 0.5,
      clearcoatRoughness: 0.2,
      emissive: '#e0a030',
      emissiveIntensity: 0.4,
      side: THREE.DoubleSide,
      envMapIntensity: 1.5,
    }),
  // soft white, slightly satin
  arch: () =>
    new THREE.MeshPhysicalMaterial({ color: '#f7f6f2', roughness: 0.5, metalness: 0, sheen: 0.5, sheenRoughness: 0.5, sheenColor: new THREE.Color('#ffffff'), side: THREE.DoubleSide, envMapIntensity: 0.85 }),
  letters: () => new THREE.MeshStandardMaterial({ color: '#dfb860', roughness: 0.4, metalness: 0.2, emissive: '#6a4a14', emissiveIntensity: 0.4, envMapIntensity: 1.2 }),
}

function Studio() {
  const { gl, scene } = useThree()
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl)
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    if (/[?&]debug\b/.test(window.location.search)) window.__pv = { scene, gl, env }
    return () => {
      scene.environment = null
      env.dispose()
      pm.dispose()
    }
  }, [gl, scene])
  return null
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
      const make = MATS[kind] || MATS.arch
      const m = make()
      if (kind === 'arch' || kind === 'wings') {
        o.geometry.computeBoundingBox()
        const depth = Math.max(0, FRONT - o.geometry.boundingBox.max.z) // how far behind the front this panel's face is
        m.color.multiplyScalar(1 - Math.min(0.26, depth * 0.5))
      }
      o.material = m
      o.castShadow = o.receiveShadow = kind !== 'letters'
    })
    return g
  }, [scene])
  return <primitive object={root} />
}

// camera: a fixed distance that always fits the object, whatever the shape of the frame
const TARGET = new THREE.Vector3(0, 2.45, 0)
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
    const dH = 3.9 / Math.tan(fov / 2) // half the object's height (+ air)
    const dW = (aspect < 1 ? 4.7 : 5.7) / (Math.tan(fov / 2) * aspect) // half its width (+ air)
    const dist = Math.max(dH, dW) + 2
    if (!c.__init) {
      c.__init = true
      camera.position.set(0, TARGET.y + dist * 0.34, dist * 0.94)
    }
    // keep the distance while the frame is resized
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
  return <div className={`pv-load${active ? '' : ' is-done'}`} aria-hidden="true"><i style={{ transform: `scaleX(${Math.max(0.03, progress / 100)})` }} /></div>
}

export default function ProductViewer({ url, label }) {
  const idle = useRef(!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  const [live, setLive] = useState(false)
  const [visible, setVisible] = useState(true)
  const wrap = useRef(null)
  const touched = useRef(() => {})
  touched.current = () => {
    idle.current = false
    setLive(true)
  }
  const onTouch = useMemo(() => () => touched.current(), [])

  useEffect(() => {
    const el = wrap.current
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.02 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div className={`pv${live ? ' is-live' : ''}`} ref={wrap} role="img" aria-label={label}>
      <Canvas
        className="pv-canvas"
        frameloop={visible ? 'always' : 'never'}
        dpr={[1, 1.75]}
        camera={{ fov: 30, near: 0.1, far: 80, position: [0, 4, 16] }}
        shadows="soft"
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.12
        }}
      >
        <Studio />
        <ambientLight intensity={0.22} />
        <pointLight position={[0, 6.5, 4.5]} intensity={62} distance={0} decay={2} color="#fff6ea" />
        <pointLight position={[-5.2, 2, 3.4]} intensity={30} distance={0} decay={2} color="#fff1dc" />
        <pointLight position={[5.2, 2, 3.4]} intensity={30} distance={0} decay={2} color="#fff1dc" />
        {/* the warm glow of the render: gold light low between the wings and behind the arch */}
        <pointLight position={[0, 0.9, 1.4]} intensity={14} distance={0} decay={2} color="#ffb84d" />
        <pointLight position={[0, 3.2, -2.6]} intensity={26} distance={0} decay={2} color="#ffd79a" />
        <directionalLight position={[0, 4, -8]} intensity={1.1} color="#fff0d8" />
        <directionalLight
          position={[-5, 8, 7]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
          shadow-normalBias={0.02}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={7}
          shadow-camera-bottom={-2}
          shadow-camera-near={1}
          shadow-camera-far={30}
        />
        <Suspense fallback={null}>
          <Model url={url} />
        </Suspense>
        <Rig idle={idle} onTouch={onTouch} />
      </Canvas>
      <Load />
    </div>
  )
}

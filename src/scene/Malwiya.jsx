import { useEffect, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { Group, LoadingManager, MeshStandardMaterial, SRGBColorSpace } from 'three'
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js'
import { duskUniforms, loadState } from './world'

const MODEL_URL = `${import.meta.env.BASE_URL}assets/malwiya/model.dae`

async function loadCollada() {
  const manager = new LoadingManager()
  const loader = new ColladaLoader(manager)

  if (__SINGLE__) {
    // Single-file build: the model and its two textures are inlined into the page.
    const { daeText, textures } = await import('./singleAssets.js')
    manager.setURLModifier((url) => textures[url.split('/').pop()] || url)
    loadState.set({ progress: 0.6 })
    await new Promise((r) => setTimeout(r, 30))
    return loader.parse(daeText, '')
  }

  return new Promise((resolve, reject) => {
    loader.load(
      MODEL_URL,
      resolve,
      (e) => {
        if (e && e.lengthComputable) loadState.set({ progress: Math.min(0.92, (e.loaded / e.total) * 0.92) })
      },
      reject,
    )
  })
}

// The .dae carries SketchUp's Phong materials. We keep every colour, every texture
// and every material assignment exactly as authored, and only swap the shading
// model for a physically based one so sunlight, shadow and dusk behave properly.
function upgradeMaterial(src, anisotropy, cache) {
  if (cache.has(src)) return cache.get(src)
  if (src.map) {
    src.map.anisotropy = anisotropy
    src.map.colorSpace = SRGBColorSpace
  }
  const opaque = !src.transparent || src.opacity >= 0.999
  const mat = new MeshStandardMaterial({
    name: src.name,
    color: src.color.clone(),
    map: src.map || null,
    roughness: 0.93,
    metalness: 0,
    transparent: !opaque,
    opacity: opaque ? 1 : src.opacity,
    side: src.side,
  })

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uDuskMix = duskUniforms.uDuskMix
    shader.uniforms.uTermY = duskUniforms.uTermY
    shader.uniforms.uTermSoft = duskUniforms.uTermSoft
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vWY;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvWY = (modelMatrix * vec4(transformed, 1.0)).y;',
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying float vWY;\nuniform float uDuskMix;\nuniform float uTermY;\nuniform float uTermSoft;',
      )
      .replace(
        '#include <opaque_fragment>',
        `float duskLit = smoothstep(uTermY - uTermSoft * 0.35, uTermY + uTermSoft, vWY);
         outgoingLight *= mix(1.0, max(duskLit, 0.015), uDuskMix);
         #include <opaque_fragment>`,
      )
  }
  mat.customProgramCacheKey = () => 'malwiya-dusk'
  cache.set(src, mat)
  return mat
}

export default function Malwiya() {
  const gl = useThree((s) => s.gl)
  const threeScene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const [scene, setScene] = useState(null)

  // Once the monument is in the scene graph, compile every shader (sun, shadows,
  // dusk mask) before the first frame is shown, so the first scroll never hitches.
  useEffect(() => {
    if (!scene) return
    let alive = true
    const id = requestAnimationFrame(async () => {
      try {
        await gl.compileAsync(threeScene, camera)
      } catch (e) {
        /* compile happens lazily on first render if this fails */
      }
      if (alive) loadState.set({ progress: 1, ready: true })
    })
    return () => {
      alive = false
      cancelAnimationFrame(id)
    }
  }, [scene, gl, threeScene, camera])

  useEffect(() => {
    let cancelled = false
    loadCollada()
      .then((result) => {
        if (cancelled) return
        const root = result.scene
        const aniso = Math.min(16, gl.capabilities.getMaxAnisotropy())
        const cache = new Map()
        // SketchUp exports its edge outlines as separate line objects. They are a
        // modelling aid, not architecture — the faces carry all of the geometry —
        // so they are removed from the render (every face is untouched).
        const edges = []
        root.traverse((o) => {
          if (o.isLine || o.isLineSegments) edges.push(o)
        })
        edges.forEach((e) => e.parent && e.parent.remove(e))
        root.traverse((o) => {
          if (!o.isMesh) return
          o.material = Array.isArray(o.material)
            ? o.material.map((m) => upgradeMaterial(m, aniso, cache))
            : upgradeMaterial(o.material, aniso, cache)
          o.castShadow = true
          o.receiveShadow = true
        })
        // The SketchUp group carries a mirrored transform (negative determinant) and
        // SketchUp has already baked that mirror into the triangle winding. three.js
        // would flip face culling a second time for mirrored objects, hiding the true
        // outer walls and showing the inside of the far ones. Baking each mesh's world
        // transform into its vertices gives the exact same geometry, but with a plain
        // transform, so the winding and normals are used precisely as authored.
        root.updateMatrixWorld(true)
        const meshes = []
        root.traverse((o) => o.isMesh && meshes.push(o))
        const monument = new Group()
        monument.name = 'Malwiya'
        for (const m of meshes) {
          const g = m.geometry.clone()
          g.applyMatrix4(m.matrixWorld)
          m.geometry = g
          m.position.set(0, 0, 0)
          m.quaternion.identity()
          m.scale.set(1, 1, 1)
          m.updateMatrix()
          monument.add(m)
        }
        monument.updateMatrixWorld(true)
        monument.traverse((o) => {
          o.matrixAutoUpdate = false // the monument never moves
        })
        setScene(monument)
      })
      .catch((err) => {
        console.error('Could not load the Malwiya model', err)
        loadState.set({ error: String(err) })
      })
    return () => {
      cancelled = true
    }
  }, [gl])

  if (!scene) return null
  return <primitive object={scene} />
}

import { NoColorSpace, RepeatWrapping, SRGBColorSpace, TextureLoader } from 'three'
import { duskUniforms } from './world'
import brickUrl from '../assets/malwiya/brick.jpg'
import brickBumpUrl from '../assets/malwiya/brick_bump.jpg'
import plasterUrl from '../assets/malwiya/plaster.jpg'
import plasterBumpUrl from '../assets/malwiya/plaster_bump.jpg'

// ─────────────────────────────────────────────────────────────────────────────
//  THE MATERIAL OF THE MALWIYA
//  The tower and the great mosque's wall are baked mud brick (Abbasid Samarra, 9th c.),
//  so the stone textures the SketchUp model came with (a yellow rubble wall and a khaki
//  plaster) are replaced by two seamless earth textures made for this site:
//    brick   — fired-clay brick in a running bond, brick-to-brick tone changes, sand-filled
//              joints, erosion pits and weathering streaks (one tile = about 3 m, 8 courses)
//    plaster — dried earth plaster with hairline cracks and grit, for the ramp and the plinth tops
//  Each has a matching bump map so the low sun picks out every course. The model's own UVs
//  (≈ 0.33 tiles per metre) are untouched, so the geometry and its mapping stay as authored.
// ─────────────────────────────────────────────────────────────────────────────

let cache = null

export function loadEarth(anisotropy = 8) {
  if (!cache) {
    const loader = new TextureLoader()
    const get = (url, color) =>
      loader.loadAsync(url).then((t) => {
        t.wrapS = t.wrapT = RepeatWrapping
        t.colorSpace = color ? SRGBColorSpace : NoColorSpace
        t.anisotropy = anisotropy
        return t
      })
    cache = Promise.all([get(brickUrl, true), get(brickBumpUrl, false), get(plasterUrl, true), get(plasterBumpUrl, false)]).then(
      ([bm, bb, pm, pb]) => ({
        brick: { map: bm, bumpMap: bb, bumpScale: 2.2 },
        plaster: { map: pm, bumpMap: pb, bumpScale: 1.2 },
      }),
    )
  }
  return cache
}

// The "last light" line that climbs the tower at dusk (see grade.js): everything below the
// terminator height goes dark. Shared by the tower and the enclosure wall, so both share one shader.
export function applyDusk(mat) {
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
  return mat
}

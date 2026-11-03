import { ShaderChunk } from 'three'

// Khronos "Neutral" tone mapping subtracts the darkest colour channel from dark pixels,
// which turns every dim beige into saturated mustard. Soften that toe so dark tones keep
// their hue and the fade to black stays a warm, neutral earth colour.
// (Idempotent: safe to import from every scene.)
ShaderChunk.tonemapping_pars_fragment = ShaderChunk.tonemapping_pars_fragment.replace(
  'float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;',
  'float offset = 0.04 * smoothstep( 0.0, 0.16, x );',
)

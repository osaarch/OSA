import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `npm run build`         -> dist/         (normal multi-file site, deploy anywhere)
// `npm run build:single`  -> dist-single/  (one self-contained index.html, model inlined)
export default defineConfig(({ mode }) => {
  const single = mode === 'single'
  return {
    base: './',
    plugins: [react(), single && viteSingleFile()].filter(Boolean),
    define: { __SINGLE__: JSON.stringify(single) },
    publicDir: single ? false : 'public',
    build: {
      outDir: single ? 'dist-single' : 'dist',
      chunkSizeWarningLimit: 4000,
      assetsInlineLimit: single ? 100_000_000 : 4096,
    },
  }
})

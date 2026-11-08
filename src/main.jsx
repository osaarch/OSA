import { createRoot } from 'react-dom/client'
import '@fontsource/cairo/arabic-300.css'
import '@fontsource/cairo/arabic-400.css'
import './styles.css'
import App from './App.jsx'

// The site is rebuilt on every update and the old files are replaced. A browser that still holds an
// older index.html then asks for a file (the stadium's 3D, the Malwiya scene) that no longer exists.
// When that happens the page reloads once, so it picks up the current build by itself.
window.addEventListener('vite:preloadError', (e) => {
  try {
    const last = Number(sessionStorage.getItem('osa-reload') || 0)
    if (Date.now() - last < 30000) return // already tried a moment ago: no loop
    sessionStorage.setItem('osa-reload', String(Date.now()))
  } catch {
    return
  }
  e.preventDefault()
  window.location.reload()
})

createRoot(document.getElementById('root')).render(<App />)

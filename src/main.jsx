import { createRoot } from 'react-dom/client'
import '@fontsource/jost/latin-300.css'
import '@fontsource/jost/latin-400.css'
import '@fontsource/cairo/arabic-300.css'
import '@fontsource/cairo/arabic-400.css'
import './styles.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(<App />)

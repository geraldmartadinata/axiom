import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { LanguageProvider } from './store/LanguageContext.jsx'
import './index.css'

window.addEventListener('error', (e) => {
  const el = document.createElement('pre')
  el.id = 'err-dump'
  el.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#000;color:#f66;padding:12px;max-width:100vw;white-space:pre-wrap;font-size:11px;'
  el.textContent = 'ERR: ' + ((e.error && e.error.stack) || e.message)
  document.body.appendChild(el)
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
)

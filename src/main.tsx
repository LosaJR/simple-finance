import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

let reloadingForUpdate = false

const updatePwa = () => {
  void navigator.serviceWorker.getRegistration().then((registration) => registration?.update())
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!reloadingForUpdate) {
      reloadingForUpdate = true
      window.location.reload()
    }
  })

  void navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).then((registration) => {
    void registration.update()
    window.addEventListener('focus', updatePwa)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') updatePwa()
    })
    window.setInterval(updatePwa, 60 * 60 * 1000)
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

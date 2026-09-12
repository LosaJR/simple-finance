import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

let reloadingForUpdate = false

const activateWaitingWorker = (registration: ServiceWorkerRegistration) => {
  registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
}

const updatePwa = () => {
  void navigator.serviceWorker.getRegistration().then(async (registration) => {
    if (!registration) return
    await registration.update()
    activateWaitingWorker(registration)
  })
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const serviceWorkerUrl = `${import.meta.env.BASE_URL}sw.js`
  const serviceWorkerScope = import.meta.env.BASE_URL

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!reloadingForUpdate) {
      reloadingForUpdate = true
      window.location.reload()
    }
  })

  void navigator.serviceWorker.register(serviceWorkerUrl, { scope: serviceWorkerScope, updateViaCache: 'none' }).then((registration) => {
    registration.addEventListener('updatefound', () => {
      const installing = registration.installing
      installing?.addEventListener('statechange', () => {
        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
          activateWaitingWorker(registration)
        }
      })
    })

    void registration.update()
    activateWaitingWorker(registration)
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

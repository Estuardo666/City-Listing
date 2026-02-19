'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    const registerServiceWorker = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      } catch {
        // noop: service worker registration failure should not block the app
      }
    }

    if (document.readyState === 'complete') {
      void registerServiceWorker()
      return
    }

    const onLoad = () => {
      void registerServiceWorker()
    }

    window.addEventListener('load', onLoad)
    return () => window.removeEventListener('load', onLoad)
  }, [])

  return null
}

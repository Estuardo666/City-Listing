'use client'

import { useEffect } from 'react'

/**
 * Registers the service worker on every page load.
 *
 * It deliberately does NOT ask for notification permission: a prompt on first
 * paint is the fastest way to get permanently denied. Subscribing happens from
 * `WebPushOptIn`, in response to a tap.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Registration is best-effort; the site works without it.
    })
  }, [])

  return null
}

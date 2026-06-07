'use client'

import { useEffect } from 'react'
import { subscribePushAction } from '@/actions/push'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return
    }

    const registerAndSubscribe = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')

        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const existing = await registration.pushManager.getSubscription()
        if (existing) return

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidKey) return

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as any,
        })

        const subJson = subscription.toJSON()
        if (subJson.keys) {
          await subscribePushAction({
            endpoint: subscription.endpoint,
            p256dh: subJson.keys.p256dh || '',
            auth: subJson.keys.auth || '',
          })
        }
      } catch {
        // Silent failure - push is optional
      }
    }

    registerAndSubscribe()
  }, [])

  return null
}

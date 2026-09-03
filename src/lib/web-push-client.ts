'use client'

import { subscribePushAction, unsubscribePushAction } from '@/actions/push'

/** Browser-side Web Push helpers. Server code must not import this. */

export type WebPushStatus = 'unsupported' | 'unconfigured' | 'denied' | 'granted' | 'default'

/** VAPID keys travel as base64url; `subscribe` wants raw bytes. */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; ++i) {
    view[i] = rawData.charCodeAt(i)
  }
  return buffer
}

export function getWebPushStatus(): WebPushStatus {
  if (typeof window === 'undefined') return 'unsupported'
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return 'unsupported'
  }
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return 'unconfigured'
  return Notification.permission as WebPushStatus
}

export async function isSubscribedToWebPush(): Promise<boolean> {
  if (getWebPushStatus() === 'unsupported') return false
  const registration = await navigator.serviceWorker.ready
  return (await registration.pushManager.getSubscription()) !== null
}

/**
 * Asks for permission and registers the subscription server-side. Must be
 * called from a user gesture — browsers ignore (and Safari refuses) a
 * permission request that is not tied to one.
 */
export async function enableWebPush(): Promise<{ ok: boolean; status: WebPushStatus }> {
  const status = getWebPushStatus()
  if (status === 'unsupported' || status === 'unconfigured' || status === 'denied') {
    return { ok: false, status }
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return { ok: false, status: permission as WebPushStatus }

  const registration = await navigator.serviceWorker.ready
  const existing = await registration.pushManager.getSubscription()
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string),
    }))

  const json = subscription.toJSON()
  if (!json.keys?.p256dh || !json.keys?.auth) return { ok: false, status: 'granted' }

  const result = await subscribePushAction({
    endpoint: subscription.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  })

  return { ok: result.success, status: 'granted' }
}

export async function disableWebPush(): Promise<boolean> {
  if (getWebPushStatus() === 'unsupported') return false

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return true

  await unsubscribePushAction(subscription.endpoint)
  return subscription.unsubscribe()
}

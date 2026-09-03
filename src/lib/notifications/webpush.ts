import 'server-only'

import type { PushSubscription as WebPushSubscription } from 'web-push'

/**
 * Web Push (VAPID) transport. Loaded dynamically so a deployment without VAPID
 * keys — CI, previews — still builds and imports this module.
 */

export interface WebPushPayload {
  title: string
  body: string
  /** Opened by the service worker's `notificationclick` handler. */
  url?: string
  image?: string
  data?: Record<string, string>
  tag?: string
}

export interface WebPushSendResult {
  ok: boolean
  status: number
  /** True when the endpoint is gone and the subscription row must be deleted. */
  expired: boolean
  reason?: string
}

interface VapidConfig {
  publicKey: string
  privateKey: string
  subject: string
}

export function getVapidConfig(): VapidConfig | null {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim()
  if (!publicKey || !privateKey) return null

  const subject = process.env.VAPID_SUBJECT?.trim() || 'mailto:hola@viveloja.com'
  return { publicKey, privateKey, subject }
}

export function isWebPushConfigured(): boolean {
  return getVapidConfig() !== null
}

export async function sendWebPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: WebPushPayload,
): Promise<WebPushSendResult> {
  const config = getVapidConfig()
  if (!config) {
    return { ok: false, status: 0, expired: false, reason: 'VAPID_NOT_CONFIGURED' }
  }

  const webpush = (await import('web-push')).default
  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey)

  const target: WebPushSubscription = {
    endpoint: subscription.endpoint,
    keys: { p256dh: subscription.p256dh, auth: subscription.auth },
  }

  try {
    const result = await webpush.sendNotification(target, JSON.stringify(payload))
    return { ok: true, status: result.statusCode, expired: false }
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode ?? 0
    return {
      ok: false,
      status,
      // 404/410 are the push service saying the subscription is dead.
      expired: status === 404 || status === 410,
      reason: (error as Error).message,
    }
  }
}

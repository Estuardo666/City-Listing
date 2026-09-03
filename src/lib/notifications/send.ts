import 'server-only'

import { canonicalUrl } from '@/lib/canonical-urls'
import { prisma } from '@/lib/prisma'

import { isApnsConfigured, sendApnsNotification } from './apns'
import { emptyDelivery, type DeliveryResult, type Notification } from './types'
import { isWebPushConfigured, sendWebPushNotification } from './webpush'

/**
 * The one place a notification is delivered.
 *
 * Callers describe *what happened* (`Notification`); this decides who still
 * wants it and over which transports. Every surface — iOS via APNs, the web app
 * and the installed PWA via Web Push — receives the same title, body and deep
 * link, so a notification tapped anywhere lands on the same screen.
 *
 * Never throws: a failed notification must not roll back the action that
 * triggered it.
 */
export async function notifyUser(
  userId: string,
  notification: Notification,
): Promise<DeliveryResult> {
  try {
    const preference = await prisma.notificationPreference.findUnique({ where: { userId } })

    // No row means the user never touched the settings: default to opted in,
    // matching how `enabled` behaved before per-type flags existed.
    if (preference) {
      if (!preference.enabled) return emptyDelivery('disabled')
      if (preference[notification.type] === false) return emptyDelivery('type-disabled')
    }

    const wantsPush = preference?.pushEnabled ?? true
    if (!wantsPush) return emptyDelivery('disabled')

    const url = resolveUrl(notification)
    const result = emptyDelivery()

    const [deviceTokens, subscriptions] = await Promise.all([
      isApnsConfigured()
        ? prisma.deviceToken.findMany({ where: { userId, revokedAt: null } })
        : Promise.resolve([]),
      isWebPushConfigured()
        ? prisma.pushSubscription.findMany({ where: { userId } })
        : Promise.resolve([]),
    ])

    if (deviceTokens.length === 0 && subscriptions.length === 0) {
      return emptyDelivery('no-targets')
    }

    const deadTokens: string[] = []
    const deadEndpoints: string[] = []

    await Promise.all([
      ...deviceTokens.map(async (device) => {
        const outcome = await sendApnsNotification(
          device.token,
          {
            title: notification.title,
            body: notification.body,
            deepLink: url,
            data: { type: notification.type, ...notification.data },
            collapseId: notification.collapseId,
          },
          device.environment,
        )

        if (outcome.ok) result.push.sent += 1
        else result.push.failed += 1
        if (outcome.unregistered) deadTokens.push(device.token)
      }),
      ...subscriptions.map(async (subscription) => {
        const outcome = await sendWebPushNotification(subscription, {
          title: notification.title,
          body: notification.body,
          url,
          image: notification.image,
          data: { type: notification.type, ...notification.data },
          tag: notification.collapseId,
        })

        if (outcome.ok) result.webPush.sent += 1
        else result.webPush.failed += 1
        if (outcome.expired) deadEndpoints.push(subscription.endpoint)
      }),
    ])

    // Dead targets are pruned so a stale row is not retried on every send.
    if (deadTokens.length > 0) {
      const pruned = await prisma.deviceToken.deleteMany({ where: { token: { in: deadTokens } } })
      result.push.pruned = pruned.count
    }
    if (deadEndpoints.length > 0) {
      const pruned = await prisma.pushSubscription.deleteMany({
        where: { endpoint: { in: deadEndpoints } },
      })
      result.webPush.pruned = pruned.count
    }

    return result
  } catch (error) {
    console.error('[notifications] delivery failed', userId, notification.type, error)
    return emptyDelivery()
  }
}

/** Fan-out helper; deduplicates so a user is never notified twice. */
export async function notifyUsers(
  userIds: string[],
  notification: Notification,
): Promise<DeliveryResult[]> {
  const unique = [...new Set(userIds)]
  return Promise.all(unique.map((userId) => notifyUser(userId, notification)))
}

function resolveUrl(notification: Notification): string | undefined {
  if (notification.target) {
    return canonicalUrl(notification.target.kind, notification.target.slug)
  }
  return notification.url
}

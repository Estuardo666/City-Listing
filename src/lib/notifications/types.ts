import type { ShareableKind } from '@/lib/canonical-urls'

/**
 * Notification types double as the per-user opt-out flags on
 * `NotificationPreference`, so adding one here means adding the column too.
 */
export const NOTIFICATION_TYPES = [
  'eventReminders',
  'newFollowedVenuePost',
  'reviewReply',
  'claimUpdates',
  'messageReceived',
  'moderationUpdates',
] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export interface NotificationTarget {
  kind: ShareableKind
  slug: string
}

export interface Notification {
  type: NotificationType
  title: string
  body: string
  /** Opened when the notification is tapped, on every platform. */
  target?: NotificationTarget
  /** Absolute URL, used only when the destination has no canonical page. */
  url?: string
  image?: string
  /** Merged into the APNs payload and the Web Push data blob. */
  data?: Record<string, string>
  /** Collapses replaceable notifications (e.g. one per conversation). */
  collapseId?: string
}

export interface DeliveryResult {
  push: { sent: number; failed: number; pruned: number }
  webPush: { sent: number; failed: number; pruned: number }
  skipped?: 'disabled' | 'type-disabled' | 'no-targets'
}

export function emptyDelivery(skipped?: DeliveryResult['skipped']): DeliveryResult {
  return {
    push: { sent: 0, failed: 0, pruned: 0 },
    webPush: { sent: 0, failed: 0, pruned: 0 },
    ...(skipped ? { skipped } : {}),
  }
}

import { canonicalUrl } from '@/lib/canonical-urls'
import { notifyUser } from '@/lib/notifications'
import { prisma } from '@/lib/prisma'
import { VIEW_RETENTION_DAYS } from '@/lib/views'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Safety valve: one run never pushes more than this. */
const MAX_PER_RUN = 200
/** Rows scanned before filtering; keeps already-notified favorites from
 * starving new ones when the window is busy. */
const SCAN_LIMIT = 1000

/**
 * Drains due event reminders. Scheduled from `vercel.json`.
 *
 * Only events the user actually saved are pushed — the in-app feed
 * (`pullUpcomingEventNotificationsAction`) lists every upcoming event, which is
 * fine for a list the user opened and would be spam on a lock screen.
 *
 * `EventNotification` is the dedupe key, exactly as the in-app feed uses it, so
 * a reminder is delivered once per user and event no matter how often the cron
 * fires or how it overlaps with the feed.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return Response.json({ error: 'CRON_SECRET no configurado' }, { status: 503 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  const now = new Date()
  // Widest window any user can configure; each row is filtered against its own
  // `hoursAhead` below.
  const horizon = new Date(now.getTime() + 168 * 60 * 60 * 1000)

  const favorites = await prisma.favorite.findMany({
    where: {
      eventId: { not: null },
      event: {
        status: 'APPROVED',
        startDate: { gte: now, lte: horizon },
      },
    },
    orderBy: { event: { startDate: 'asc' } },
    take: SCAN_LIMIT,
    select: {
      userId: true,
      eventId: true,
      event: { select: { id: true, title: true, slug: true, startDate: true, location: true } },
      user: {
        select: {
          notificationPreference: {
            select: { enabled: true, pushEnabled: true, eventReminders: true, hoursAhead: true },
          },
        },
      },
    },
  })

  // Prisma cannot correlate `Favorite.userId` with `EventNotification.userId`
  // inside a single `where`, so the dedupe rows are loaded and matched here.
  // The in-app feed writes the same rows, which is intended: a reminder the
  // user already saw in the app is not pushed again.
  const eventIds = favorites.map((favorite) => favorite.eventId).filter((id): id is string => !!id)
  const alreadyNotified = await prisma.eventNotification.findMany({
    where: { eventId: { in: eventIds }, userId: { in: favorites.map((f) => f.userId) } },
    select: { userId: true, eventId: true },
  })
  const notifiedKeys = new Set(alreadyNotified.map((row) => `${row.userId}:${row.eventId}`))
  const candidates = favorites
    .filter((favorite) => !notifiedKeys.has(`${favorite.userId}:${favorite.eventId}`))
    .slice(0, MAX_PER_RUN)

  let sent = 0
  let skipped = 0

  for (const candidate of candidates) {
    const event = candidate.event
    if (!event) continue

    const preference = candidate.user.notificationPreference

    // Checked before the dedupe row is written: `notifyUser` would skip these
    // users anyway, but burning the row would silence the reminder for good if
    // they turn notifications back on later.
    if (
      preference &&
      (!preference.enabled || !preference.pushEnabled || !preference.eventReminders)
    ) {
      skipped += 1
      continue
    }

    const hoursAhead = preference?.hoursAhead ?? 48
    const dueAt = new Date(event.startDate.getTime() - hoursAhead * 60 * 60 * 1000)
    if (dueAt > now) {
      skipped += 1
      continue
    }

    // Claim the dedupe row first: if another run already took it the unique
    // constraint throws and this one skips instead of double-notifying.
    try {
      await prisma.eventNotification.create({
        data: { userId: candidate.userId, eventId: event.id },
      })
    } catch {
      skipped += 1
      continue
    }

    await notifyUser(candidate.userId, {
      type: 'eventReminders',
      title: event.title,
      body: event.location
        ? `Se acerca en ${event.location}. Toca para ver los detalles.`
        : 'Se acerca. Toca para ver los detalles.',
      target: { kind: 'event', slug: event.slug },
      collapseId: `event-${event.id}`,
      data: { eventId: event.id, url: canonicalUrl('event', event.slug) },
    })
    sent += 1
  }

  // Same run prunes the view log: it only feeds a rolling window, so anything
  // past the retention horizon is dead weight on every "popular now" query.
  const purged = await prisma.viewEvent.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - VIEW_RETENTION_DAYS * 24 * 60 * 60 * 1000) } },
  })

  return Response.json({
    scanned: favorites.length,
    examined: candidates.length,
    sent,
    skipped,
    purgedViewEvents: purged.count,
  })
}

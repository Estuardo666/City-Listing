# Hoy en Loja

## Agenda and tourist routes

The Home events use a one-card-per-view image carousel; short routes use an image grid.
`GET /api/mobile/v1/agenda?period=today|tomorrow|weekend|upcoming` returns up to 100
chronological events. The weekend is Saturday/Sunday (remaining days when already
in the weekend); upcoming spans 30 calendar days. Prices of null mean unknown, not free.
Web `/eventos` and iOS Agenda show the same groups, times, venues and prices.

Tourist itineraries already exist at `/rutas/crear` and `POST /me/routes`. These are
ordered cultural/gastronomic/other sightseeing stops, not hiking trail records.
The web editor now stores numeric minutes and stop coordinates; linked venues
supply coordinates when available. iOS creation includes cover URL, numeric minutes,
ordered stops and coordinates. `/admin/rutas` reviews submissions; admin-created
routes publish immediately, other authors enter moderation. Collections already
have create/edit/reorder flows at `/dashboard/colecciones` and `/me/collections`.

## Schedule changes and cancellation

Deploy additive migration `20260904020000_event_update_notices` before the new code.
Authorized owners/admins change schedules in the event editor or cancel a published
event explicitly. Edits lock the event row and persist notices for users who saved
it in the same transaction. Retrying an unchanged edit/cancellation makes no notice.
Draft/rejected events cannot be cancelled into public visibility. Cancelled events
leave listings but keep a public detail with a cancellation banner and matching SEO status.

Notices are visible at `/dashboard/notificaciones` and iOS Guardados → Cambios en
eventos via authenticated `GET /me/event-updates`, even without push permission.
Push uses the existing eventReminders preference and configured Web Push/APNs.
An after-response worker claims at most 50 rows with a 5-minute lease. Failed
transports remain queued; the existing daily cron retries. Delivery is at-least-once,
not exactly-once (partial delivery/crash may cause retries). No-target/opt-out rows
remain in the inbox but are not retried for push. Large backlogs may take multiple
daily runs; no paid scheduling upgrade is made. No refunds or email are automated.

iOS map previews measure content height rather than reserving a fixed detent.

## Shared contract

Web Home and iOS Home consume `GET /api/mobile/v1/today`. It returns Loja's date,
generation timestamp, remaining/ongoing events today, venues open according to
published hours, single-day routes up to 180 minutes, and editorial venue collections.
Unknown hours are excluded; overnight hours include yesterday's late shift. An
event without an end time is excluded once its start time has passed. Clients
refresh once per minute while visible; the endpoint is not cached.

## Publish a collection

As an administrator, use `/dashboard/colecciones`: create a public collection,
write its description, add approved active venues and a short recommendation in
each item's note. Only nonempty public admin-authored collections containing
exclusively approved active venues appear in Home (six most recently updated).
This is an initial editorial policy, not proof that an author resides in Loja.
Author names are genuine account names. No production content is seeded by this change.
Web and iOS open the existing public detail and use the existing favorites flow.

## Measurement

- `save`: written in the same transaction as a newly created authenticated favorite.
  Repeated idempotent mobile requests do not create a new event. Removing and later
  saving again counts as a new save. Local-only anonymous iOS favorites are excluded.
- `directions`: best-effort POST to `/api/mobile/v1/interactions`, before map handoff;
  never blocks navigation. Counts intent, not a verified visit. One event per
  target/source/viewer in a fixed 30-minute bucket, protected by a database unique
  index even when Redis is unavailable. The existing Redis limiter is best-effort.
- Only directions can be submitted publicly; save events cannot be forged through
  the analytics endpoint. Targets must be public. No raw IP, user ID, location,
  email or device identifier is stored in InteractionEvent. The dedupe digest uses
  HMAC with the existing NEXTAUTH_SECRET and a rotating time bucket.
- 30-day retention via the existing protected notification cron. Data prior to
  installation is not reconstructed. Sources are client-reported and not suitable
  for billing or fraud-proof attribution.

Owner dashboards show current favorites separately from 30-day save/click counts.
Administrators can view totals by content type and platform at `/admin/descubrimiento`.

## Release and verification

Apply additive migration `20260904010000_discovery_interactions` before serving
the updated favorite endpoints. Deploy backend/web first, then iOS. The older
iOS client ignores new optional metrics; the new Home shows a retry state against
an old server without `/today`. Do not roll back/drop the analytics table when
rolling back application code.

`npm run test:config` covers day boundaries and business hours. `npm run test:mobile`
requires an isolated seeded PostgreSQL database and includes discovery and
deduplication integration tests. The iOS target includes TodayTests and the
`-uiTesting-today` empty-state UI test. Existing screenshot fixtures stay stable.
No production deployment or migration is performed by these tests.

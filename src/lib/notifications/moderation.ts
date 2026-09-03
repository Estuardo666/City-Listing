import 'server-only'

import type { ShareableKind } from '@/lib/canonical-urls'

import { notifyUser } from './send'

const LABELS: Partial<Record<ShareableKind, string>> = {
  venue: 'Tu local',
  event: 'Tu evento',
  post: 'Tu artículo',
  route: 'Tu ruta',
}

/**
 * Tells an author that a submission left moderation. Shared by the venue, event
 * and post status actions so the wording and the deep link stay identical
 * whichever content type was reviewed.
 *
 * Silent for any status other than APPROVED/REJECTED — an admin moving a row
 * back to PENDING is not news for the author.
 */
export async function notifyModerationDecision(input: {
  userId: string
  kind: ShareableKind
  slug: string
  name: string
  status: string
}): Promise<void> {
  if (input.status !== 'APPROVED' && input.status !== 'REJECTED') return

  const label = LABELS[input.kind] ?? 'Tu publicación'
  const approved = input.status === 'APPROVED'

  await notifyUser(input.userId, {
    type: 'moderationUpdates',
    title: approved ? `${label} ya está publicado` : `${label} necesita cambios`,
    body: approved
      ? `${input.name} ya es visible en Vive Loja.`
      : `${input.name} no pasó la revisión. Revisa los detalles y vuelve a enviarlo.`,
    target: { kind: input.kind, slug: input.slug },
    collapseId: `moderation-${input.kind}-${input.slug}`,
    data: { status: input.status },
  })
}

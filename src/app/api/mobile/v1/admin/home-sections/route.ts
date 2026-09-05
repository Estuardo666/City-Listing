import { requireMobileAdmin } from '@/lib/mobile-admin'
import { mobileError, mobileSuccess, withMobileErrors } from '@/lib/mobile-response'
import { createHomeSection } from '@/lib/home-sections-admin'
import { getAllHomeSections } from '@/lib/queries/home-sections'
import { homeSectionInputSchema } from '@/schemas/home-section.schema'

/**
 * Home composition, editable from the in-app admin panel. Same rules as the web
 * admin: a valid mobile token whose role is ADMIN, nothing else.
 */

export const GET = withMobileErrors(async (request: Request) => {
  const denied = await requireMobileAdmin(request)
  if (denied) return denied
  return mobileSuccess({ sections: await getAllHomeSections() })
})

export const POST = withMobileErrors(async (request: Request) => {
  const denied = await requireMobileAdmin(request)
  if (denied) return denied

  const body = await request.json().catch(() => null)
  const parsed = homeSectionInputSchema.safeParse(
    body && typeof body === 'object' ? { params: {}, ...(body as Record<string, unknown>) } : body,
  )
  if (!parsed.success) {
    return mobileError('VALIDATION_ERROR', 'La sección no es válida.', 422, parsed.error.flatten().fieldErrors)
  }

  return mobileSuccess({ section: await createHomeSection(parsed.data) })
})

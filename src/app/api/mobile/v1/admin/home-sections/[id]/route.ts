import { requireMobileAdmin } from '@/lib/mobile-admin'
import { mobileError, mobileSuccess, withMobileErrors } from '@/lib/mobile-response'
import { deleteHomeSection, toggleHomeSection, updateHomeSection } from '@/lib/home-sections-admin'
import { homeSectionUpdateSchema } from '@/schemas/home-section.schema'

type Context = { params: Promise<{ id: string }> }

/**
 * PATCH accepts either the full section (type + params resent so `params` stays
 * validated against its type) or the shorthand `{ isActive }` the list screen
 * sends when the switch is flipped.
 */
export const PATCH = withMobileErrors(async (request: Request, context: Context) => {
  const denied = await requireMobileAdmin(request)
  if (denied) return denied
  const { id } = await context.params

  const body = await request.json().catch(() => null)
  if (body && typeof body === 'object' && !('type' in body) && 'isActive' in body) {
    const isActive = Boolean((body as { isActive: unknown }).isActive)
    const ok = await toggleHomeSection(id, isActive)
    return ok ? mobileSuccess({ id, isActive }) : mobileError('NOT_FOUND', 'La sección ya no existe.', 404)
  }

  const parsed = homeSectionUpdateSchema.safeParse(
    body && typeof body === 'object' ? { params: {}, ...(body as Record<string, unknown>) } : body,
  )
  if (!parsed.success) {
    return mobileError('VALIDATION_ERROR', 'La sección no es válida.', 422, parsed.error.flatten().fieldErrors)
  }

  const section = await updateHomeSection(id, parsed.data)
  return section ? mobileSuccess({ section }) : mobileError('NOT_FOUND', 'La sección ya no existe.', 404)
})

export const DELETE = withMobileErrors(async (request: Request, context: Context) => {
  const denied = await requireMobileAdmin(request)
  if (denied) return denied
  const { id } = await context.params
  const deleted = await deleteHomeSection(id)
  return deleted ? mobileSuccess({ id }) : mobileError('NOT_FOUND', 'La sección ya no existe.', 404)
})

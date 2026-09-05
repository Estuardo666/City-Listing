import { requireMobileAdmin } from '@/lib/mobile-admin'
import { mobileError, mobileSuccess, withMobileErrors } from '@/lib/mobile-response'
import { reorderHomeSections } from '@/lib/home-sections-admin'
import { getAllHomeSections } from '@/lib/queries/home-sections'
import { homeSectionReorderSchema } from '@/schemas/home-section.schema'

/** Takes the full id list in its new order, as produced by drag-to-reorder. */
export const PATCH = withMobileErrors(async (request: Request) => {
  const denied = await requireMobileAdmin(request)
  if (denied) return denied

  const parsed = homeSectionReorderSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return mobileError('VALIDATION_ERROR', 'El orden no es válido.', 422, parsed.error.flatten().fieldErrors)
  }

  await reorderHomeSections(parsed.data.ids)
  return mobileSuccess({ sections: await getAllHomeSections() })
})

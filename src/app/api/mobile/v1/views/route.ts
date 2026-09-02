import { z } from 'zod'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'

const viewSchema = z.object({
  kind: z.enum(['venue', 'event', 'watchEvent']),
  itemId: z.string().min(1).max(100),
})

export async function POST(request: Request) {
  let body: unknown
  try { body = await request.json() } catch { return mobileError('VALIDATION_ERROR', 'La vista no es válida.', 422) }
  const parsed = viewSchema.safeParse(body)
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'La vista no es válida.', 422, parsed.error.flatten().fieldErrors)

  try {
    const result = parsed.data.kind === 'venue'
      ? await prisma.venue.updateMany({ where: { id: parsed.data.itemId, status: 'APPROVED', isActive: true }, data: { viewCount: { increment: 1 } } })
      : parsed.data.kind === 'event'
        ? await prisma.event.updateMany({ where: { id: parsed.data.itemId, status: 'APPROVED' }, data: { viewCount: { increment: 1 } } })
        : await prisma.watchEvent.updateMany({ where: { id: parsed.data.itemId, status: 'ACTIVE' }, data: { viewCount: { increment: 1 } } })
    if (result.count !== 1) return mobileError('NOT_FOUND', 'El contenido no está disponible.', 404)
    return mobileSuccess({ recorded: true, kind: parsed.data.kind, itemId: parsed.data.itemId })
  } catch {
    return mobileError('NOT_FOUND', 'El contenido no está disponible.', 404)
  }
}

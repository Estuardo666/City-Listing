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
    if (parsed.data.kind === 'venue') await prisma.venue.update({ where: { id: parsed.data.itemId }, data: { viewCount: { increment: 1 } } })
    if (parsed.data.kind === 'event') await prisma.event.update({ where: { id: parsed.data.itemId }, data: { viewCount: { increment: 1 } } })
    if (parsed.data.kind === 'watchEvent') await prisma.watchEvent.update({ where: { id: parsed.data.itemId }, data: { viewCount: { increment: 1 } } })
    return mobileSuccess({ recorded: true, kind: parsed.data.kind, itemId: parsed.data.itemId })
  } catch {
    return mobileError('NOT_FOUND', 'El contenido no está disponible.', 404)
  }
}

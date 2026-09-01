import { z } from 'zod'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'

const reportSchema = z.object({
  messageId: z.string().trim().min(1),
  reason: z.enum(['SPAM', 'HARASSMENT', 'SCAM', 'OTHER']),
})

/** Reports a message without exposing it to another user or creating a new schema dependency. */
export async function POST(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para reportar mensajes.', 401)

  const parsed = reportSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'El reporte no es válido.', 422, parsed.error.flatten().fieldErrors)

  const message = await prisma.message.findFirst({
    where: {
      id: parsed.data.messageId,
      OR: [{ senderId: principal.userId }, { receiverId: principal.userId }],
    },
    select: { id: true, content: true },
  })
  if (!message) return mobileError('NOT_FOUND', 'Mensaje no encontrado.', 404)

  if (!message.content?.startsWith('[REPORTADO:')) {
    await prisma.message.update({
      where: { id: message.id },
      data: { content: `[REPORTADO: ${parsed.data.reason}] ${message.content ?? ''}` },
    })
  }

  return mobileSuccess({ reported: true })
}

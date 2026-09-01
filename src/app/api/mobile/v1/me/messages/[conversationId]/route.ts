import { z } from 'zod'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'

const messageSelect = {
  id: true, venueId: true, senderId: true, receiverId: true, content: true, images: true,
  isRead: true, createdAt: true,
} as const

const readSchema = z.object({ read: z.literal(true).default(true) })

function parseConversationId(value: string) {
  const split = value.split(':')
  if (split.length !== 2 || !split[0] || !split[1]) return null
  return { venueId: split[0], participantId: split[1] }
}

export async function GET(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para ver la conversación.', 401)
  const { conversationId } = await params
  const parsed = parseConversationId(conversationId)
  if (!parsed) return mobileError('VALIDATION_ERROR', 'La conversación no es válida.', 422)
  const where = {
    venueId: parsed.venueId,
    OR: [
      { senderId: principal.userId, receiverId: parsed.participantId },
      { senderId: parsed.participantId, receiverId: principal.userId },
    ],
  }
  const messages = await prisma.message.findMany({ where, orderBy: { createdAt: 'asc' }, take: 200, select: messageSelect })
  if (!messages.length) return mobileError('NOT_FOUND', 'Conversación no encontrada.', 404)
  return mobileSuccess(messages)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para marcar mensajes.', 401)
  const { conversationId } = await params
  const parsedConversation = parseConversationId(conversationId)
  if (!parsedConversation) return mobileError('VALIDATION_ERROR', 'La conversación no es válida.', 422)
  const parsedBody = readSchema.safeParse(await request.json().catch(() => ({ read: true })))
  if (!parsedBody.success) return mobileError('VALIDATION_ERROR', 'La acción no es válida.', 422, parsedBody.error.flatten().fieldErrors)
  const result = await prisma.message.updateMany({
    where: {
      venueId: parsedConversation.venueId,
      senderId: parsedConversation.participantId,
      receiverId: principal.userId,
      isRead: false,
    },
    data: { isRead: true, readAt: new Date() },
  })
  return mobileSuccess({ markedRead: result.count })
}

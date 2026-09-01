import { z } from 'zod'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'

const messageSchema = z.object({
  venueId: z.string().trim().min(1),
  receiverId: z.string().trim().min(1),
  content: z.string().trim().min(1).max(2_000),
})

export async function GET(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para ver tus mensajes.', 401)
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: principal.userId }, { receiverId: principal.userId }] },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true, venueId: true, senderId: true, receiverId: true, content: true, images: true, isRead: true, createdAt: true,
      venue: { select: { id: true, name: true, slug: true } },
      sender: { select: { id: true, name: true, image: true } },
      receiver: { select: { id: true, name: true, image: true } },
    },
  })
  const conversations = new Map<string, any>()
  for (const message of messages) {
    const other = message.senderId === principal.userId ? message.receiver : message.sender
    const key = `${message.venueId}:${other.id}`
    const current = conversations.get(key)
    if (!current) {
      conversations.set(key, {
        id: key,
        venue: message.venue,
        participant: other,
        lastMessage: message,
        unreadCount: message.receiverId === principal.userId && !message.isRead ? 1 : 0,
      })
    } else if (message.receiverId === principal.userId && !message.isRead) {
      current.unreadCount += 1
    }
  }
  return mobileSuccess(Array.from(conversations.values()))
}

export async function POST(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para enviar mensajes.', 401)
  const parsed = messageSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'El mensaje no es válido.', 422, parsed.error.flatten().fieldErrors)
  if (parsed.data.receiverId === principal.userId) return mobileError('VALIDATION_ERROR', 'No puedes enviarte mensajes a ti mismo.', 422)

  const [venue, receiver, blocked] = await Promise.all([
    prisma.venue.findFirst({ where: { id: parsed.data.venueId, status: 'APPROVED', isActive: true }, select: { id: true, name: true, slug: true } }),
    prisma.user.findUnique({ where: { id: parsed.data.receiverId }, select: { id: true, name: true, image: true } }),
    prisma.blockedUser.findFirst({ where: { venueId: parsed.data.venueId, OR: [{ blockedUserId: principal.userId }, { blockedUserId: parsed.data.receiverId }] }, select: { id: true } }),
  ])
  if (!venue || !receiver) return mobileError('NOT_FOUND', 'El local o destinatario no está disponible.', 404)
  if (blocked) return mobileError('MESSAGING_BLOCKED', 'La conversación no está disponible.', 403)

  const created = await prisma.message.create({
    data: { venueId: venue.id, senderId: principal.userId, receiverId: receiver.id, content: parsed.data.content },
    select: {
      id: true, venueId: true, senderId: true, receiverId: true, content: true, images: true, isRead: true, createdAt: true,
      venue: { select: { id: true, name: true, slug: true } },
      sender: { select: { id: true, name: true, image: true } },
      receiver: { select: { id: true, name: true, image: true } },
    },
  })
  return mobileSuccess(created)
}

import { z } from 'zod'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'

const blockSchema = z.object({
  venueId: z.string().trim().min(1),
  userId: z.string().trim().min(1),
  reason: z.string().trim().max(300).optional(),
})

async function authorizeConversation(userId: string, input: z.infer<typeof blockSchema>) {
  const [venue, target, conversation] = await Promise.all([
    prisma.venue.findUnique({ where: { id: input.venueId }, select: { id: true, userId: true } }),
    prisma.user.findUnique({ where: { id: input.userId }, select: { id: true } }),
    prisma.message.findFirst({
      where: {
        venueId: input.venueId,
        OR: [
          { senderId: userId, receiverId: input.userId },
          { senderId: input.userId, receiverId: userId },
        ],
      },
      select: { id: true },
    }),
  ])
  if (!venue || !target || input.userId === userId) return null
  if (!conversation && venue.userId !== userId) return null
  return venue
}

export async function POST(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para bloquear usuarios.', 401)
  const parsed = blockSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'El bloqueo no es válido.', 422, parsed.error.flatten().fieldErrors)
  const venue = await authorizeConversation(principal.userId, parsed.data)
  if (!venue) return mobileError('FORBIDDEN', 'No puedes bloquear a este usuario.', 403)

  await prisma.blockedUser.upsert({
    where: { venueId_blockedUserId: { venueId: venue.id, blockedUserId: parsed.data.userId } },
    create: { venueId: venue.id, blockedUserId: parsed.data.userId, blockedBy: principal.userId, reason: parsed.data.reason || null },
    update: { blockedBy: principal.userId, reason: parsed.data.reason || null },
  })
  return mobileSuccess({ blocked: true })
}

export async function DELETE(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para desbloquear usuarios.', 401)
  const parsed = blockSchema.pick({ venueId: true, userId: true }).safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'El desbloqueo no es válido.', 422, parsed.error.flatten().fieldErrors)
  const venue = await authorizeConversation(principal.userId, { ...parsed.data })
  if (!venue) return mobileError('FORBIDDEN', 'No puedes desbloquear a este usuario.', 403)
  const result = await prisma.blockedUser.deleteMany({
    where: { venueId: venue.id, blockedUserId: parsed.data.userId, blockedBy: principal.userId },
  })
  return mobileSuccess({ blocked: false, removed: result.count > 0 })
}

'use server'
import { getServerSession } from 'next-auth'
import { after } from 'next/server'
import { revalidatePath } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { queueEventUpdate, drainEventUpdates } from '@/lib/notifications/event-updates'
import { invalidateEventCache } from '@/lib/cache-invalidation'

export async function cancelEventAction(eventId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, error: 'Inicia sesión.' }
  try {
    const result = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Event" WHERE id = ${eventId} FOR UPDATE`
      const before = await tx.event.findUniqueOrThrow({ where: { id: eventId } })
      if (before.userId !== session.user.id && session.user.role !== 'ADMIN') throw new Error('No tienes permiso.')
      if (before.status === 'CANCELLED') return before
      if (before.status !== 'APPROVED') throw new Error('Solo se pueden cancelar eventos publicados.')
      const event = await tx.event.update({ where: { id: eventId }, data: { status: 'CANCELLED' } })
      await queueEventUpdate(tx, before, event)
      return event
    })
    after(() => drainEventUpdates())
    await invalidateEventCache(eventId)
    revalidatePath('/eventos'); revalidatePath(`/eventos/${result.slug}`)
    revalidatePath('/dashboard/eventos')
    return { success: true }
  } catch { return { success: false, error: 'No se pudo cancelar el evento.' } }
}

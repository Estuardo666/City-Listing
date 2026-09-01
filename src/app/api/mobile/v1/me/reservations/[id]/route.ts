import { z } from 'zod'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'

const reservationSelect = {
  id: true, venueId: true, eventId: true, date: true, time: true, partySize: true, status: true,
  notes: true, cancelReason: true, createdAt: true, updatedAt: true,
  venue: { select: { id: true, name: true, slug: true } },
  event: { select: { id: true, title: true, slug: true } },
} as const

const cancelSchema = z.object({
  status: z.literal('CANCELLED').optional(),
  cancelReason: z.string().trim().max(500).optional(),
})

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para ver la reserva.', 401)
  const { id } = await params
  const reservation = await prisma.reservation.findFirst({ where: { id, userId: principal.userId }, select: reservationSelect })
  if (!reservation) return mobileError('NOT_FOUND', 'Reserva no encontrada.', 404)
  return mobileSuccess(reservation)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para cancelar la reserva.', 401)
  const { id } = await params
  const parsed = cancelSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'La cancelación no es válida.', 422, parsed.error.flatten().fieldErrors)
  const reservation = await prisma.reservation.findFirst({
    where: { id, userId: principal.userId },
    select: { id: true, status: true, date: true, venue: { select: { reservationSettings: { select: { cancelBeforeHours: true } } } } },
  })
  if (!reservation) return mobileError('NOT_FOUND', 'Reserva no encontrada.', 404)
  if (reservation.status === 'CANCELLED') {
    const current = await prisma.reservation.findUnique({ where: { id }, select: reservationSelect })
    return mobileSuccess(current, { idempotent: true })
  }
  const cancelBeforeHours = reservation.venue?.reservationSettings?.cancelBeforeHours ?? 2
  const cutoff = new Date(Date.now() + cancelBeforeHours * 60 * 60 * 1_000)
  if (reservation.date <= cutoff) return mobileError('CANCELLATION_WINDOW_CLOSED', 'Ya no se puede cancelar esta reserva.', 409)
  const updated = await prisma.reservation.update({
    where: { id }, data: { status: 'CANCELLED', cancelReason: parsed.data.cancelReason }, select: reservationSelect,
  })
  return mobileSuccess(updated, { idempotent: false })
}

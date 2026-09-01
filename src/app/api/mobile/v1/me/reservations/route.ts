import { z } from 'zod'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'

const reservationSchema = z.object({
  venueId: z.string().trim().min(1).optional(),
  eventId: z.string().trim().min(1).optional(),
  date: z.string().datetime({ offset: true }),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  partySize: z.number().int().min(1).max(50),
  notes: z.string().trim().max(500).optional(),
}).superRefine((value, context) => {
  if ((value.venueId ? 1 : 0) + (value.eventId ? 1 : 0) !== 1) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['venueId'], message: 'Selecciona un local o evento.' })
  }
})

const reservationSelect = {
  id: true,
  venueId: true,
  eventId: true,
  date: true,
  time: true,
  partySize: true,
  status: true,
  notes: true,
  cancelReason: true,
  createdAt: true,
  updatedAt: true,
  venue: { select: { id: true, name: true, slug: true } },
  event: { select: { id: true, title: true, slug: true } },
} as const

function presentReservation(value: any) {
  return {
    ...value,
    venue: value.venue ?? null,
    event: value.event ?? null,
  }
}

export async function GET(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para ver tus reservas.', 401)
  const reservations = await prisma.reservation.findMany({
    where: { userId: principal.userId },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
    take: 100,
    select: reservationSelect,
  })
  return mobileSuccess(reservations.map(presentReservation))
}

export async function POST(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para reservar.', 401)
  const parsed = reservationSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'La reserva no es válida.', 422, parsed.error.flatten().fieldErrors)

  const date = new Date(parsed.data.date)
  if (date.getTime() < Date.now()) return mobileError('VALIDATION_ERROR', 'La fecha debe ser futura.', 422)

  const venue = parsed.data.venueId
    ? await prisma.venue.findFirst({ where: { id: parsed.data.venueId, status: 'APPROVED', isActive: true }, select: { id: true, name: true, slug: true, reservationSettings: { select: { acceptsReservations: true, maxPartySize: true } } } })
    : null
  const event = parsed.data.eventId
    ? await prisma.event.findFirst({ where: { id: parsed.data.eventId, status: 'APPROVED' }, select: { id: true, title: true, slug: true, startDate: true } })
    : null
  if (parsed.data.venueId && !venue) return mobileError('NOT_FOUND', 'El local no está disponible.', 404)
  if (parsed.data.eventId && !event) return mobileError('NOT_FOUND', 'El evento no está disponible.', 404)
  if (venue?.reservationSettings?.acceptsReservations === false) return mobileError('RESERVATIONS_DISABLED', 'Este local no acepta reservas.', 409)
  if (venue?.reservationSettings?.maxPartySize && parsed.data.partySize > venue.reservationSettings.maxPartySize) {
    return mobileError('PARTY_SIZE_TOO_LARGE', 'La cantidad de personas supera el máximo permitido.', 422)
  }

  const duplicate = await prisma.reservation.findFirst({
    where: {
      userId: principal.userId,
      venueId: parsed.data.venueId,
      eventId: parsed.data.eventId,
      date,
      time: parsed.data.time,
      partySize: parsed.data.partySize,
      status: { not: 'CANCELLED' },
    },
    select: reservationSelect,
  })
  if (duplicate) return mobileSuccess(presentReservation(duplicate), { idempotent: true })

  const created = await prisma.reservation.create({
    data: { userId: principal.userId, venueId: parsed.data.venueId, eventId: parsed.data.eventId, date, time: parsed.data.time, partySize: parsed.data.partySize, notes: parsed.data.notes },
    select: reservationSelect,
  })
  return mobileSuccess(presentReservation(created), { idempotent: false })
}

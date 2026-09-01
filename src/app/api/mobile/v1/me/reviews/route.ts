import { z } from 'zod'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'

const reviewSchema = z.object({
  venueId: z.string().trim().min(1).optional(),
  eventId: z.string().trim().min(1).optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  content: z.string().trim().max(2_000).optional(),
}).superRefine((value, context) => {
  if ((value.venueId ? 1 : 0) + (value.eventId ? 1 : 0) !== 1) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['venueId'], message: 'Selecciona un local o evento.' })
  }
})

const reviewSelect = {
  id: true, rating: true, title: true, content: true, status: true, createdAt: true, updatedAt: true,
  user: { select: { id: true, name: true, image: true } },
} as const

export async function GET(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para ver tus reseñas.', 401)
  const url = new URL(request.url)
  const venueId = url.searchParams.get('venueId') ?? undefined
  const eventId = url.searchParams.get('eventId') ?? undefined
  if ((venueId ? 1 : 0) + (eventId ? 1 : 0) !== 1) return mobileError('VALIDATION_ERROR', 'Indica venueId o eventId.', 422)
  const reviews = await prisma.review.findMany({
    where: { ...(venueId ? { venueId } : { eventId }), status: { in: ['APPROVED', 'PENDING'] } },
    orderBy: { createdAt: 'desc' }, take: 100, select: reviewSelect,
  })
  return mobileSuccess(reviews)
}

export async function POST(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para reseñar.', 401)
  const parsed = reviewSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'La reseña no es válida.', 422, parsed.error.flatten().fieldErrors)
  const { venueId, eventId } = parsed.data
  const target = venueId
    ? await prisma.venue.findFirst({ where: { id: venueId, status: 'APPROVED', isActive: true }, select: { id: true } })
    : await prisma.event.findFirst({ where: { id: eventId, status: 'APPROVED' }, select: { id: true } })
  if (!target) return mobileError('NOT_FOUND', 'El contenido no está disponible.', 404)

  const existing = await prisma.review.findFirst({ where: { userId: principal.userId, ...(venueId ? { venueId } : { eventId }) } })
  const review = existing
    ? await prisma.review.update({ where: { id: existing.id }, data: { rating: parsed.data.rating, title: parsed.data.title, content: parsed.data.content, status: 'PENDING' }, select: reviewSelect })
    : await prisma.review.create({ data: { userId: principal.userId, venueId, eventId, rating: parsed.data.rating, title: parsed.data.title, content: parsed.data.content, status: 'PENDING' }, select: reviewSelect })
  return mobileSuccess(review, { moderation: 'PENDING', updated: Boolean(existing) })
}

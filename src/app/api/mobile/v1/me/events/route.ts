import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

const eventSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(5_000),
  startDate: z.string().datetime({ offset: true }),
  endDate: z.string().datetime({ offset: true }).optional(),
  location: z.string().trim().min(2).max(180),
  address: z.string().trim().max(250).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  price: z.number().min(0).max(10_000).optional(),
  venueId: z.string().trim().min(1).optional(),
}).superRefine((value, context) => {
  if (value.endDate && new Date(value.endDate) <= new Date(value.startDate)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'La fecha de fin debe ser posterior.' })
  }
})

const eventSelect = {
  id: true, title: true, slug: true, description: true, image: true, startDate: true, endDate: true,
  location: true, address: true, lat: true, lng: true, price: true, status: true, createdAt: true,
  venue: { select: { id: true, name: true, slug: true } },
} as const

export async function GET(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para ver tus publicaciones.', 401)
  const events = await prisma.event.findMany({ where: { userId: principal.userId }, orderBy: { createdAt: 'desc' }, take: 100, select: eventSelect })
  return mobileSuccess(events)
}

export async function POST(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para publicar un evento.', 401)
  const parsed = eventSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'El evento no es válido.', 422, parsed.error.flatten().fieldErrors)
  const startDate = new Date(parsed.data.startDate)
  if (startDate <= new Date()) return mobileError('VALIDATION_ERROR', 'El evento debe ser futuro.', 422)
  if (parsed.data.venueId) {
    const venue = await prisma.venue.findFirst({ where: { id: parsed.data.venueId, status: 'APPROVED', isActive: true }, select: { id: true } })
    if (!venue) return mobileError('NOT_FOUND', 'El local no está disponible.', 404)
  }
  const baseSlug = slugify(parsed.data.title) || `evento-${Date.now()}`
  const slug = `${baseSlug}-${randomBytes(3).toString('hex')}`
  const created = await prisma.event.create({
    data: {
      userId: principal.userId, title: parsed.data.title, slug, description: parsed.data.description,
      startDate, endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
      location: parsed.data.location, address: parsed.data.address, lat: parsed.data.lat, lng: parsed.data.lng,
      price: parsed.data.price, venueId: parsed.data.venueId, status: 'PENDING',
    },
    select: eventSelect,
  })
  return mobileSuccess(created, { moderation: 'PENDING' })
}

import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

const routeSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(5_000),
  content: z.string().trim().max(20_000).optional(),
  image: z.string().url().max(2_000).optional(),
  duration: z.string().trim().max(80).optional(),
  difficulty: z.string().trim().max(40).optional(),
  type: z.string().trim().min(2).max(40),
  stops: z.array(z.object({ venueId: z.string().trim().min(1).optional(), title: z.string().trim().min(2).max(160), notes: z.string().trim().max(500).optional(), duration: z.string().trim().max(80).optional() })).max(50).optional(),
})

const routeSelect = { id: true, title: true, slug: true, description: true, content: true, image: true, duration: true, difficulty: true, type: true, status: true, createdAt: true, stops: { orderBy: { order: 'asc' as const }, select: { id: true, venueId: true, order: true, title: true, notes: true, duration: true } } } as const

export async function GET(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para ver tus rutas.', 401)
  const routes = await prisma.route.findMany({ where: { userId: principal.userId }, orderBy: { createdAt: 'desc' }, take: 100, select: routeSelect })
  return mobileSuccess(routes)
}

export async function POST(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para publicar una ruta.', 401)
  const parsed = routeSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'La ruta no es válida.', 422, parsed.error.flatten().fieldErrors)
  const stops = parsed.data.stops ?? []
  const venueIds = stops.flatMap((stop) => stop.venueId ? [stop.venueId] : [])
  if (venueIds.length) {
    const count = await prisma.venue.count({ where: { id: { in: venueIds }, status: 'APPROVED', isActive: true } })
    if (count !== new Set(venueIds).size) return mobileError('NOT_FOUND', 'Una parada no está disponible.', 404)
  }
  const baseSlug = slugify(parsed.data.title) || 'ruta'
  const route = await prisma.route.create({ data: { userId: principal.userId, title: parsed.data.title, slug: `${baseSlug}-${randomBytes(3).toString('hex')}`, description: parsed.data.description, content: parsed.data.content, image: parsed.data.image, duration: parsed.data.duration, difficulty: parsed.data.difficulty, type: parsed.data.type, status: 'PENDING', stops: { create: stops.map((stop, index) => ({ venueId: stop.venueId, order: index, title: stop.title, notes: stop.notes, duration: stop.duration })) } }, select: routeSelect })
  return mobileSuccess(route, { moderation: 'PENDING' })
}

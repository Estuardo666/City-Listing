import { z } from 'zod'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'

const followingSchema = z.object({ venueId: z.string().trim().min(1).max(100) })

const venueSelect = {
  id: true,
  name: true,
  slug: true,
  image: true,
  location: true,
  address: true,
  phone: true,
  lat: true,
  lng: true,
} as const

export async function GET(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para ver tus seguimientos.', 401)

  const follows = await prisma.userFollowingVenue.findMany({
    where: { userId: principal.userId },
    orderBy: { createdAt: 'desc' },
    include: { venue: { select: venueSelect } },
  })

  return mobileSuccess(follows.map((follow) => ({
    id: follow.id,
    venueId: follow.venueId,
    createdAt: follow.createdAt,
    venue: follow.venue,
  })))
}

export async function POST(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para seguir locales.', 401)
  const parsed = followingSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'El local no es válido.', 422, parsed.error.flatten().fieldErrors)

  const venue = await prisma.venue.findFirst({ where: { id: parsed.data.venueId, status: 'APPROVED', isActive: true }, select: venueSelect })
  if (!venue) return mobileError('NOT_FOUND', 'El local no está disponible.', 404)

  const follow = await prisma.userFollowingVenue.upsert({
    where: { userId_venueId: { userId: principal.userId, venueId: venue.id } },
    create: { userId: principal.userId, venueId: venue.id },
    update: {},
  })

  return mobileSuccess({ following: true, id: follow.id, venueId: venue.id, createdAt: follow.createdAt, venue })
}

export async function DELETE(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para dejar de seguir locales.', 401)
  const parsed = followingSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'El local no es válido.', 422, parsed.error.flatten().fieldErrors)

  await prisma.userFollowingVenue.deleteMany({ where: { userId: principal.userId, venueId: parsed.data.venueId } })
  return mobileSuccess({ following: false, venueId: parsed.data.venueId })
}

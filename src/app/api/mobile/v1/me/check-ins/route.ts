import { z } from 'zod'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'

const checkInSchema = z.object({
  venueId: z.string().trim().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  note: z.string().trim().max(500).optional(),
  photoUrl: z.string().url().max(2_000).optional(),
})

const checkInSelect = {
  id: true, venueId: true, lat: true, lng: true, note: true, photoUrl: true, createdAt: true,
  venue: { select: { id: true, name: true, slug: true, image: true } },
} as const

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const rad = Math.PI / 180
  const dLat = (lat2 - lat1) * rad
  const dLng = (lng2 - lng1) * rad
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function GET(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para ver tus check-ins.', 401)
  const checkIns = await prisma.checkIn.findMany({ where: { userId: principal.userId }, orderBy: { createdAt: 'desc' }, take: 100, select: checkInSelect })
  return mobileSuccess(checkIns)
}

export async function POST(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para registrar un check-in.', 401)
  const parsed = checkInSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'El check-in no es válido.', 422, parsed.error.flatten().fieldErrors)
  const venue = await prisma.venue.findFirst({ where: { id: parsed.data.venueId, status: 'APPROVED', isActive: true }, select: { id: true, lat: true, lng: true } })
  if (!venue) return mobileError('NOT_FOUND', 'El local no está disponible.', 404)
  if (venue.lat != null && venue.lng != null && distanceMeters(parsed.data.lat, parsed.data.lng, venue.lat, venue.lng) > 1_000) {
    return mobileError('OUT_OF_RANGE', 'Debes estar cerca del local para registrar el check-in.', 422)
  }
  const recent = await prisma.checkIn.findFirst({ where: { userId: principal.userId, venueId: venue.id, createdAt: { gt: new Date(Date.now() - 12 * 60 * 60 * 1_000) } }, select: { id: true } })
  if (recent) return mobileError('ALREADY_CHECKED_IN', 'Ya registraste un check-in reciente en este local.', 409)
  const created = await prisma.checkIn.create({ data: { userId: principal.userId, venueId: venue.id, lat: parsed.data.lat, lng: parsed.data.lng, note: parsed.data.note, photoUrl: parsed.data.photoUrl }, select: checkInSelect })
  await prisma.user.update({ where: { id: principal.userId }, data: { totalCheckIns: { increment: 1 } } })
  return mobileSuccess(created)
}

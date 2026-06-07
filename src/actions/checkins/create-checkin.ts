'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { POINTS } from '@/lib/gamification'
import { awardPointsAction, incrementUserStatsAction } from '@/actions/gamification'
import { checkAndAwardBadgesAction } from '@/actions/gamification'
import type { ActionResponse } from '@/types/action-response'
import type { CheckIn } from '@prisma/client'

const checkInSchema = z.object({
  venueId: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  note: z.preprocess((v) => (v === '' || v == null ? null : v), z.string().max(200).nullable()),
  photoUrl: z.preprocess((v) => (v === '' || v == null ? null : v), z.string().url().nullable()),
})

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function createCheckInAction(input: unknown): Promise<ActionResponse<CheckIn>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const parsed = checkInSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }

    const venue = await prisma.venue.findUnique({
      where: { id: parsed.data.venueId },
      select: { id: true, lat: true, lng: true, slug: true },
    })
    if (!venue) return { success: false, error: 'Local no encontrado.' }

    if (venue.lat !== null && venue.lng !== null) {
      const distance = haversineDistance(parsed.data.lat, parsed.data.lng, venue.lat, venue.lng)
      if (distance > 200) {
        return { success: false, error: `Estás a ${Math.round(distance)}m del local. Debes estar a menos de 200m.` }
      }
    }

    const created = await prisma.checkIn.create({
      data: {
        userId: session.user.id,
        venueId: parsed.data.venueId,
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        note: parsed.data.note,
        photoUrl: parsed.data.photoUrl,
      },
    })

    // Gamificación: otorgar puntos y verificar badges
    const hasPhoto = !!parsed.data.photoUrl
    const points = hasPhoto ? POINTS.CHECKIN + POINTS.CHECKIN_PHOTO : POINTS.CHECKIN

    await awardPointsAction(session.user.id, points, 'checkin_created')
    await incrementUserStatsAction(session.user.id, {
      checkIns: 1,
      photos: hasPhoto ? 1 : 0,
    })
    await checkAndAwardBadgesAction(session.user.id)

    revalidatePath(`/locales/${venue.slug}`)
    return { success: true, data: created }
  } catch {
    return { success: false, error: 'No se pudo hacer check-in.' }
  }
}

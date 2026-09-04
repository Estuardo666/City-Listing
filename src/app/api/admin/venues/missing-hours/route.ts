import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, unauthorized } from '@/lib/api/require-admin'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

const DEFAULT_TAKE = 50
const MAX_TAKE = 200

/**
 * Locales que nunca pueden aparecer en el filtro "abierto ahora" porque no tienen
 * horarios usables: sin filas, o con todas las filas en formato invalido
 * (openMinute/closeMinute quedan en NULL, ver migracion business_hours_minutes).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin()
    if (!session) return unauthorized()

    const { searchParams } = new URL(request.url)
    const takeParam = Number(searchParams.get('take') ?? DEFAULT_TAKE)
    const take = Number.isFinite(takeParam) ? Math.min(Math.max(1, Math.floor(takeParam)), MAX_TAKE) : DEFAULT_TAKE
    const skipParam = Number(searchParams.get('skip') ?? '0')
    const skip = Number.isFinite(skipParam) ? Math.max(0, Math.floor(skipParam)) : 0
    const onlyGoogle = searchParams.get('onlyGoogle') === 'true'

    const where: Prisma.VenueWhereInput = {
      status: 'APPROVED',
      ...(onlyGoogle && { googlePlaceId: { not: null } }),
      OR: [
        // Sin horarios cargados.
        { businessHours: { none: {} } },
        // Con horarios, pero ninguno utilizable: todos cerrados o con formato roto.
        { businessHours: { none: { isClosed: false, openMinute: { not: null }, closeMinute: { not: null } } } },
      ],
    }

    const [total, venues, withoutAnyHours, withBrokenHours] = await Promise.all([
      prisma.venue.count({ where }),
      prisma.venue.findMany({
        where,
        orderBy: [{ featured: 'desc' }, { name: 'asc' }],
        skip,
        take,
        select: {
          id: true,
          name: true,
          slug: true,
          googlePlaceId: true,
          hoursLastSync: true,
          businessHours: {
            select: { dayOfWeek: true, openTime: true, closeTime: true, isClosed: true, openMinute: true, closeMinute: true },
            orderBy: [{ dayOfWeek: 'asc' }, { openTime: 'asc' }],
          },
        },
      }),
      prisma.venue.count({ where: { status: 'APPROVED', businessHours: { none: {} } } }),
      prisma.venue.count({
        where: {
          status: 'APPROVED',
          businessHours: { some: {}, none: { isClosed: false, openMinute: { not: null }, closeMinute: { not: null } } },
        },
      }),
    ])

    return NextResponse.json({
      total,
      withoutAnyHours,
      withBrokenHours,
      venues: venues.map((v) => ({
        id: v.id,
        name: v.name,
        slug: v.slug,
        googlePlaceId: v.googlePlaceId,
        hoursLastSync: v.hoursLastSync,
        // "missing" = no hay ninguna fila; "broken" = hay filas pero ninguna sirve.
        reason: v.businessHours.length === 0 ? 'missing' : 'broken',
        canSyncWithGoogle: Boolean(v.googlePlaceId),
        hours: v.businessHours,
      })),
      pageInfo: { skip, take, hasMore: skip + venues.length < total, nextSkip: skip + venues.length },
    })
  } catch (error) {
    console.error('Missing hours error:', error)
    return NextResponse.json({ error: 'Error al obtener locales sin horarios' }, { status: 500 })
  }
}

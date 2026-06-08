import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const whereGoogle = { googlePlaceId: { not: null } } as any

    const [
      totalGoogle,
      withoutWebsite,
      withoutHours,
      neverSynced,
      syncedToday,
      staleSync,
    ] = await Promise.all([
      prisma.venue.count({ where: whereGoogle }),
      prisma.venue.count({
        where: { ...whereGoogle, OR: [{ website: null }, { website: '' }] },
      }),
      prisma.venue.count({
        where: { ...whereGoogle, businessHours: { none: {} } },
      }),
      prisma.venue.count({
        where: { ...whereGoogle, hoursLastSync: null },
      }),
      prisma.venue.count({
        where: {
          ...whereGoogle,
          hoursLastSync: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.venue.count({
        where: {
          ...whereGoogle,
          hoursLastSync: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ])

    return NextResponse.json({
      totalGoogle,
      withoutWebsite,
      withoutHours,
      neverSynced,
      syncedToday,
      staleSync,
    })
  } catch (error) {
    console.error('Error fetching quality metrics:', error)
    return NextResponse.json({ error: 'Error al obtener métricas' }, { status: 500 })
  }
}

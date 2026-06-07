import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(startOfDay)
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay())

    const [
      totalImports,
      totalVenuesOsm,
      lastImport,
      pendingReview,
      activeVenues,
      disabledVenues,
      importsToday,
      importsThisWeek,
      totalFound,
      totalDuplicates,
    ] = await Promise.all([
      prisma.osmImport.count(),
      prisma.venue.count({ where: { osmId: { not: null } } as any }),
      prisma.osmImport.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true, city: true, country: true } }),
      prisma.venue.count({ where: { osmId: { not: null }, status: 'PENDING' } as any }),
      prisma.venue.count({ where: { osmId: { not: null }, status: 'APPROVED' } as any }),
      prisma.venue.count({ where: { osmId: { not: null }, status: 'DISABLED' } as any }),
      prisma.osmImport.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.osmImport.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.osmImport.aggregate({ _sum: { foundCount: true } }),
      prisma.osmImport.aggregate({ _sum: { duplicateCount: true } }),
    ])

    return NextResponse.json({
      totalImports,
      totalVenues: totalVenuesOsm,
      lastImport: lastImport?.createdAt ?? null,
      lastImportLocation: lastImport ? `${lastImport.city}, ${lastImport.country}` : null,
      pendingReview,
      activeVenues,
      disabledVenues,
      importsToday,
      importsThisWeek,
      newPlacesDetected: totalFound._sum.foundCount ?? 0,
      duplicatesFound: totalDuplicates._sum.duplicateCount ?? 0,
    })
  } catch (error) {
    console.error('Error fetching OSM stats:', error)
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
  }
}

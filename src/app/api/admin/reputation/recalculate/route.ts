import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { recalculateAllReputations } from '@/lib/reputation'

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const result = await recalculateAllReputations()

    return NextResponse.json({
      success: true,
      processed: result.processed,
      elapsed: result.elapsed,
    })
  } catch (error) {
    console.error('Error recalculating reputation:', error)
    return NextResponse.json({ error: 'Error al recalcular reputación' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const [totalApproved, withScore, withoutScore, avgScore] = await Promise.all([
      prisma.venue.count({ where: { status: 'APPROVED' } }),
      prisma.venue.count({ where: { status: 'APPROVED', reputationScore: { gt: 0 } } }),
      prisma.venue.count({ where: { status: 'APPROVED', reputationScore: 0 } }),
      prisma.venue.aggregate({
        where: { status: 'APPROVED', reputationScore: { gt: 0 } },
        _avg: { reputationScore: true },
      }),
    ])

    return NextResponse.json({
      totalApproved,
      withScore,
      withoutScore,
      avgScore: avgScore._avg.reputationScore ?? 0,
    })
  } catch (error) {
    console.error('Error fetching reputation stats:', error)
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
  }
}

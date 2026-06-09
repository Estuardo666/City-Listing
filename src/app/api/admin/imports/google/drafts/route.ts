import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, unauthorized } from '@/lib/api/require-admin'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin()
    if (!session) return unauthorized()

    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page') || '1')
    const limit = Number(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const [drafts, total] = await Promise.all([
      prisma.venue.findMany({
        where: { status: 'DRAFT' } as any,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          phone: true,
          website: true,
          createdAt: true,
          venueCategories: {
            select: { category: { select: { name: true } } },
            take: 1,
          },
        },
      }),
      prisma.venue.count({ where: { status: 'DRAFT' } as any }),
    ])

    return NextResponse.json({
      drafts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching drafts:', error)
    return NextResponse.json({ error: 'Error al obtener borradores' }, { status: 500 })
  }
}

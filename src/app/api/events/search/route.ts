import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const q = searchParams.get('q') || ''
    const category = searchParams.get('category') || ''
    const featured = searchParams.get('featured') === 'true'
    const status = searchParams.get('status') || 'APPROVED'
    const skipParam = Number(searchParams.get('skip') ?? '0')
    const takeParam = Number(searchParams.get('take') ?? '12')
    const sort = searchParams.get('sort') || 'recent'
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : null
    const isFree = searchParams.get('free') === 'true'

    const skip = Number.isFinite(skipParam) ? Math.max(0, Math.floor(skipParam)) : 0
    const take = Number.isFinite(takeParam) ? Math.min(Math.max(1, Math.floor(takeParam)), 60) : 12

    const where: Prisma.EventWhereInput = {
      status: status as any,
      ...(q && {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { location: { contains: q, mode: 'insensitive' } },
          { address: { contains: q, mode: 'insensitive' } },
          { category: { name: { contains: q, mode: 'insensitive' } } },
        ],
      }),
      ...(category && { category: { slug: category } }),
      ...(featured && { featured: true }),
      ...(minRating !== null && { avgRating: { gte: minRating } }),
      ...(isFree && {
        OR: [{ price: null }, { price: 0 }],
      }),
    }

    let orderBy: Prisma.EventOrderByWithRelationInput[]
    switch (sort) {
      case 'rating':
        orderBy = [{ avgRating: 'desc' }, { reviewCount: 'desc' }]
        break
      case 'featured':
        orderBy = [{ featured: 'desc' }, { startDate: 'asc' }]
        break
      default:
        orderBy = [{ startDate: 'asc' }]
    }

    const events = await prisma.event.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        image: true,
        startDate: true,
        endDate: true,
        location: true,
        address: true,
        lat: true,
        lng: true,
        featured: true,
        price: true,
        isRecurring: true,
        avgRating: true,
        reviewCount: true,
        category: {
          select: { id: true, name: true, slug: true, color: true, icon: true },
        },
      },
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error in events search API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

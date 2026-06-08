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
    const hasPromotions = searchParams.get('hasPromotions') === 'true'

    const skip = Number.isFinite(skipParam) ? Math.max(0, Math.floor(skipParam)) : 0
    const take = Number.isFinite(takeParam) ? Math.min(Math.max(1, Math.floor(takeParam)), 60) : 12

    const where: Prisma.VenueWhereInput = {
      status: status as any,
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { location: { contains: q, mode: 'insensitive' } },
          { address: { contains: q, mode: 'insensitive' } },
          { category: { name: { contains: q, mode: 'insensitive' } } },
        ],
      }),
      ...(category && { category: { slug: category } }),
      ...(featured && { featured: true }),
      ...(minRating !== null && { avgRating: { gte: minRating } }),
      ...(hasPromotions && {
        promotions: {
          some: { status: 'ACTIVE', validUntil: { gte: new Date() } },
        },
      }),
    }

    let orderBy: Prisma.VenueOrderByWithRelationInput[]
    switch (sort) {
      case 'rating':
        orderBy = [{ avgRating: 'desc' }, { reviewCount: 'desc' }]
        break
      case 'featured':
        orderBy = [{ featured: 'desc' }, { createdAt: 'desc' }]
        break
      default:
        orderBy = [{ createdAt: 'desc' }]
    }

    const venues = await prisma.venue.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        location: true,
        address: true,
        lat: true,
        lng: true,
        featured: true,
        status: true,
        phone: true,
        website: true,
        priceRange: true,
        avgRating: true,
        reviewCount: true,
        verified: true,
        badge: true,
        category: {
          select: { id: true, name: true, slug: true, color: true, icon: true },
        },
      },
    })

    return NextResponse.json({ venues })
  } catch (error) {
    console.error('Error in venues search API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

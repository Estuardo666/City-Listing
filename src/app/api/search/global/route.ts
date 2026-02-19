import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const LIMIT = 5

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
    if (!q || q.length < 2) {
      return NextResponse.json({ events: [], venues: [], posts: [] })
    }

    const contains = q

    const [events, venues, posts] = await Promise.all([
      prisma.event.findMany({
        where: {
          status: 'APPROVED',
          OR: [
            { title: { contains } },
            { description: { contains } },
            { location: { contains } },
          ],
        },
        select: {
          id: true,
          title: true,
          slug: true,
          image: true,
          startDate: true,
          location: true,
          category: { select: { name: true, color: true } },
        },
        orderBy: [{ featured: 'desc' }, { startDate: 'asc' }],
        take: LIMIT,
      }),
      prisma.venue.findMany({
        where: {
          status: 'APPROVED',
          OR: [
            { name: { contains } },
            { description: { contains } },
            { location: { contains } },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          location: true,
          category: { select: { name: true, color: true } },
        },
        orderBy: [{ featured: 'desc' }, { name: 'asc' }],
        take: LIMIT,
      }),
      prisma.post.findMany({
        where: {
          status: 'APPROVED',
          OR: [
            { title: { contains } },
            { excerpt: { contains } },
          ],
        },
        select: {
          id: true,
          title: true,
          slug: true,
          image: true,
          publishedAt: true,
          category: { select: { name: true, color: true } },
        },
        orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
        take: LIMIT,
      }),
    ])

    return NextResponse.json({ events, venues, posts })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

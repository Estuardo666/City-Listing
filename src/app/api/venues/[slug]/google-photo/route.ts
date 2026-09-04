import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkMobileRateLimit } from '@/lib/mobile-rate-limit'
import { getGooglePlacePhoto } from '@/lib/google/place-photo'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'private, no-store, max-age=0' }

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!await checkMobileRateLimit(request, 'google-photo', { max: 120, windowSeconds: 60 })) {
    return NextResponse.json({ photo: null }, { status: 429, headers: { ...headers, 'Retry-After': '60' } })
  }
  const { slug } = await params
  if (slug.length > 200) return NextResponse.json({ photo: null }, { status: 400, headers })
  try {
    const venue = await prisma.venue.findFirst({
      where: { slug, status: 'APPROVED', isActive: true },
      select: { googlePlaceId: true },
    })
    if (!venue?.googlePlaceId) return NextResponse.json({ photo: null }, { headers })
    const width = new URL(request.url).searchParams.get('size') === 'large' ? 1200 : 400
    const photo = await getGooglePlacePhoto(venue.googlePlaceId, width)
    return NextResponse.json({ photo }, { headers })
  } catch {
    // Never expose upstream URLs, API credentials or private venue data.
    return NextResponse.json({ photo: null }, { status: 503, headers })
  }
}

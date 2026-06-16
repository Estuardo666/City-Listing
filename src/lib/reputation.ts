import 'server-only'
import { prisma } from '@/lib/prisma'
import { invalidateVenueCache } from '@/lib/cache-invalidation'
import { revalidatePath } from 'next/cache'

interface VenueData {
  id: string
  avgRating: number | null
  reviewCount: number
  googleRating: number | null
  googleReviewCount: number
  viewCount: number
  image: string | null
  phone: string | null
  website: string | null
  description: string
  address: string | null
  hasHours: boolean
  favoriteCount: number
  checkInCount: number
}

export function computeReputationScore(venue: VenueData): number {
  let effectiveRating = 0
  if (venue.reviewCount >= 5 && venue.avgRating !== null) {
    effectiveRating = venue.avgRating / 5
  } else if (venue.googleRating !== null && venue.googleRating > 0) {
    effectiveRating = venue.googleRating / 5
  } else if (venue.avgRating !== null) {
    effectiveRating = venue.avgRating / 5
  }

  const reviewScore = Math.min(Math.log2(venue.reviewCount + 1) / Math.log2(1000), 1)

  const googleReviewScore = Math.min(Math.log2(venue.googleReviewCount + 1) / Math.log2(1000), 1)

  const viewScore = Math.min(venue.viewCount / 10000, 1)

  const favoriteScore = Math.min(venue.favoriteCount / 100, 1)

  const checkInScore = Math.min(venue.checkInCount / 100, 1)

  const completenessItems = [
    venue.image,
    venue.phone,
    venue.website,
    venue.description && venue.description.length > 0,
    venue.address,
    venue.hasHours,
  ]
  const completeness = completenessItems.filter(Boolean).length / completenessItems.length

  const score =
    effectiveRating * 0.35 +
    reviewScore * 0.20 +
    googleReviewScore * 0.10 +
    viewScore * 0.10 +
    favoriteScore * 0.10 +
    checkInScore * 0.10 +
    completeness * 0.05

  return Math.round(score * 10000) / 100
}

export async function recalculateVenueReputation(venueId: string): Promise<void> {
  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: {
      id: true,
      avgRating: true,
      reviewCount: true,
      googleRating: true,
      googleReviewCount: true,
      viewCount: true,
      image: true,
      phone: true,
      website: true,
      description: true,
      address: true,
      businessHours: { select: { id: true }, take: 1 },
      favorites: { select: { id: true } },
      checkIns: { select: { id: true } },
    },
  })

  if (!venue) return

  const score = computeReputationScore({
    id: venue.id,
    avgRating: venue.avgRating,
    reviewCount: venue.reviewCount,
    googleRating: venue.googleRating,
    googleReviewCount: venue.googleReviewCount,
    viewCount: venue.viewCount,
    image: venue.image,
    phone: venue.phone,
    website: venue.website,
    description: venue.description,
    address: venue.address,
    hasHours: venue.businessHours.length > 0,
    favoriteCount: venue.favorites.length,
    checkInCount: venue.checkIns.length,
  })

  await prisma.venue.update({
    where: { id: venueId },
    data: { reputationScore: score },
  })

  await invalidateVenueCache(venueId)
}

export async function recalculateAllReputations(): Promise<{
  processed: number
  elapsed: number
}> {
  const start = Date.now()

  const venues = await prisma.venue.findMany({
    where: { status: 'APPROVED' },
    select: {
      id: true,
      avgRating: true,
      reviewCount: true,
      googleRating: true,
      googleReviewCount: true,
      viewCount: true,
      image: true,
      phone: true,
      website: true,
      description: true,
      address: true,
      businessHours: { select: { id: true }, take: 1 },
      favorites: { select: { id: true } },
      checkIns: { select: { id: true } },
    },
  })

  const batchSize = 100
  let processed = 0

  for (let i = 0; i < venues.length; i += batchSize) {
    const batch = venues.slice(i, i + batchSize)
    const updates = batch.map((venue) => {
      const score = computeReputationScore({
        id: venue.id,
        avgRating: venue.avgRating,
        reviewCount: venue.reviewCount,
        googleRating: venue.googleRating,
        googleReviewCount: venue.googleReviewCount,
        viewCount: venue.viewCount,
        image: venue.image,
        phone: venue.phone,
        website: venue.website,
        description: venue.description,
        address: venue.address,
        hasHours: venue.businessHours.length > 0,
        favoriteCount: venue.favorites.length,
        checkInCount: venue.checkIns.length,
      })
      return prisma.venue.update({
        where: { id: venue.id },
        data: { reputationScore: score },
      })
    })

    await Promise.all(updates)
    processed += batch.length
  }

  revalidatePath('/mejores')
  revalidatePath('/locales')

  return { processed, elapsed: Date.now() - start }
}

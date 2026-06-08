import { prisma } from '@/lib/prisma'

export const MIN_REVIEWS_FOR_RANKING = 4

const WEIGHTS = {
  avgRating: 0.35,
  reviewCount: 0.25,
  viewCount: 0.15,
  recency: 0.15,
  interaction: 0.10,
} as const

export type VenueBadgeType = 'TOP_10' | 'BEST_RATED' | 'TRENDING' | 'COMMUNITY_FAVORITE'

export type RankedVenue = {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  avgRating: number | null
  reviewCount: number
  viewCount: number
  featured: boolean
  address: string | null
  phone: string | null
  score: number
  badges: VenueBadgeType[]
  category: {
    id: string
    name: string
    slug: string
    color: string | null
    icon: string | null
  }
}

type RankedVenueRaw = {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  avgRating: number | null
  reviewCount: number
  viewCount: number
  featured: boolean
  address: string | null
  phone: string | null
  recentReviewCount: number
  favoriteCount: number
  checkInCount: number
  category: {
    id: string
    name: string
    slug: string
    color: string | null
    icon: string | null
  }
}

function computeScore(
  venue: RankedVenueRaw,
  maxReviewCount: number,
  maxViewCount: number,
  maxRecentReviews: number,
  maxInteraction: number
): number {
  const ratingScore = (venue.avgRating ?? 0) / 5

  const logReviewScore =
    maxReviewCount > 0
      ? Math.log2(venue.reviewCount + 1) / Math.log2(maxReviewCount + 1)
      : 0

  const viewScore = maxViewCount > 0 ? venue.viewCount / maxViewCount : 0

  const recencyScore =
    maxRecentReviews > 0 ? venue.recentReviewCount / maxRecentReviews : 0

  const interaction = venue.favoriteCount + venue.checkInCount
  const interactionScore = maxInteraction > 0 ? interaction / maxInteraction : 0

  return (
    ratingScore * WEIGHTS.avgRating +
    logReviewScore * WEIGHTS.reviewCount +
    viewScore * WEIGHTS.viewCount +
    recencyScore * WEIGHTS.recency +
    interactionScore * WEIGHTS.interaction
  )
}

function assignBadges(
  venues: RankedVenue[],
  allCategoryVenues: RankedVenue[]
): RankedVenue[] {
  const sortedByRating = [...allCategoryVenues]
    .filter((v) => v.reviewCount >= MIN_REVIEWS_FOR_RANKING)
    .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))

  const bestRatedId = sortedByRating[0]?.id

  const sortedByTrending = [...allCategoryVenues].sort((a, b) => {
    const aIdx = venues.findIndex((v) => v.id === a.id)
    const bIdx = venues.findIndex((v) => v.id === b.id)
    return aIdx - bIdx
  })

  const top3TrendingIds = sortedByTrending.slice(0, 3).map((v) => v.id)

  const sortedByFavorites = [...allCategoryVenues].sort(
    (a, b) => b.reviewCount - a.reviewCount
  )
  const communityFavoriteId = sortedByFavorites[0]?.id

  return venues.map((v, index) => {
    const badges: VenueBadgeType[] = []

    if (index < 10) badges.push('TOP_10')
    if (v.id === bestRatedId && bestRatedId) badges.push('BEST_RATED')
    if (top3TrendingIds.includes(v.id)) badges.push('TRENDING')
    if (v.id === communityFavoriteId && communityFavoriteId) badges.push('COMMUNITY_FAVORITE')

    return { ...v, badges }
  })
}

export async function getRankedVenues(
  categorySlugs: string[],
  take = 20
): Promise<RankedVenue[]> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const venues = await prisma.venue.findMany({
    where: {
      status: 'APPROVED',
      venueCategories: {
        some: {
          category: { slug: { in: categorySlugs } },
        },
      },
      reviewCount: { gte: MIN_REVIEWS_FOR_RANKING },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      avgRating: true,
      reviewCount: true,
      viewCount: true,
      featured: true,
      address: true,
      phone: true,
      venueCategories: {
        select: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
              icon: true,
            },
          },
        },
      },
      reviews: {
        where: { status: 'APPROVED', createdAt: { gte: thirtyDaysAgo } },
        select: { id: true },
      },
      favorites: { select: { id: true } },
      checkIns: { select: { id: true } },
    },
  })

  const rawVenues: RankedVenueRaw[] = venues.map((v) => ({
    id: v.id,
    name: v.name,
    slug: v.slug,
    description: v.description,
    image: v.image,
    avgRating: v.avgRating,
    reviewCount: v.reviewCount,
    viewCount: v.viewCount,
    featured: v.featured,
    address: v.address,
    phone: v.phone,
    recentReviewCount: v.reviews.length,
    favoriteCount: v.favorites.length,
    checkInCount: v.checkIns.length,
    category: v.venueCategories[0]?.category ?? { id: '', name: '', slug: '', color: null, icon: null },
  }))

  const maxReviewCount = Math.max(...rawVenues.map((v) => v.reviewCount), 1)
  const maxViewCount = Math.max(...rawVenues.map((v) => v.viewCount), 1)
  const maxRecentReviews = Math.max(
    ...rawVenues.map((v) => v.recentReviewCount),
    1
  )
  const maxInteraction = Math.max(
    ...rawVenues.map(
      (v) => v.favoriteCount + v.checkInCount
    ),
    1
  )

  const scored: RankedVenue[] = rawVenues.map((v) => ({
    ...v,
    score: computeScore(
      v,
      maxReviewCount,
      maxViewCount,
      maxRecentReviews,
      maxInteraction
    ),
    badges: [] as VenueBadgeType[],
  }))

  scored.sort((a, b) => b.score - a.score)

  const allSorted = [...scored]
  const topVenues = scored.slice(0, take)

  return assignBadges(topVenues, allSorted)
}

export async function getBestRatedVenue(categorySlugs: string[]) {
  return prisma.venue.findFirst({
    where: {
      status: 'APPROVED',
      venueCategories: {
        some: {
          category: { slug: { in: categorySlugs } },
        },
      },
      reviewCount: { gte: MIN_REVIEWS_FOR_RANKING },
    },
    orderBy: [{ avgRating: 'desc' }, { reviewCount: 'desc' }],
    select: { id: true, avgRating: true },
  })
}

export async function getTrendingVenues(categorySlugs: string[], take = 3) {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const venues = await prisma.venue.findMany({
    where: {
      status: 'APPROVED',
      venueCategories: {
        some: {
          category: { slug: { in: categorySlugs } },
        },
      },
    },
    select: {
      id: true,
      reviews: {
        where: { status: 'APPROVED', createdAt: { gte: thirtyDaysAgo } },
        select: { id: true },
      },
      favorites: { select: { id: true } },
      checkIns: { select: { id: true } },
    },
  })

  const sorted = venues
    .map((v) => ({
      id: v.id,
      score: v.reviews.length * 2 + v.favorites.length + v.checkIns.length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, take)

  return sorted.map((v) => v.id)
}

export function getBadgeInfo(badge: VenueBadgeType) {
  const badges: Record<VenueBadgeType, { label: string; icon: string; color: string }> = {
    TOP_10: {
      label: 'Top 10 de su categoria',
      icon: '🏆',
      color: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    BEST_RATED: {
      label: 'Mejor calificado',
      icon: '⭐',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    TRENDING: {
      label: 'Tendencia del mes',
      icon: '🔥',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
    },
    COMMUNITY_FAVORITE: {
      label: 'Favorito de la comunidad',
      icon: '👑',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
    },
  }
  return badges[badge]
}

import 'server-only'
import { prisma } from '@/lib/prisma'
import { MIN_REVIEWS_FOR_RANKING, type VenueBadgeType } from '@/lib/badges'

export { MIN_REVIEWS_FOR_RANKING, type VenueBadgeType }

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

function assignBadges(
  venues: RankedVenue[],
  allCategoryVenues: RankedVenue[]
): RankedVenue[] {
  const sortedByRating = [...allCategoryVenues]
    .filter((v) => v.reviewCount >= MIN_REVIEWS_FOR_RANKING)
    .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))

  const bestRatedId = sortedByRating[0]?.id

  const top3Ids = allCategoryVenues.slice(0, 3).map((v) => v.id)

  const sortedByReviewCount = [...allCategoryVenues].sort(
    (a, b) => b.reviewCount - a.reviewCount
  )
  const communityFavoriteId = sortedByReviewCount[0]?.id

  return venues.map((v, index) => {
    const badges: VenueBadgeType[] = []

    if (index < 10) badges.push('TOP_10')
    if (v.id === bestRatedId && bestRatedId) badges.push('BEST_RATED')
    if (top3Ids.includes(v.id)) badges.push('TRENDING')
    if (v.id === communityFavoriteId && communityFavoriteId) badges.push('COMMUNITY_FAVORITE')

    return { ...v, badges }
  })
}

export async function getRankedVenues(
  categorySlugs: string[],
  take = 20
): Promise<RankedVenue[]> {
  const venues = await prisma.venue.findMany({
    where: {
      status: 'APPROVED',
      reputationScore: { gt: 0 },
      venueCategories: {
        some: {
          category: { slug: { in: categorySlugs } },
        },
      },
    },
    orderBy: { reputationScore: 'desc' },
    take: take * 2,
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
      reputationScore: true,
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
    },
  })

  const ranked: RankedVenue[] = venues.map((v) => ({
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
    score: v.reputationScore,
    badges: [] as VenueBadgeType[],
    category: v.venueCategories[0]?.category ?? {
      id: '',
      name: '',
      slug: '',
      color: null,
      icon: null,
    },
  }))

  ranked.sort((a, b) => b.score - a.score)

  const allSorted = [...ranked]
  const topVenues = ranked.slice(0, take)

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

import 'server-only'
import { prisma } from '@/lib/prisma'
import { getLifestyleKeywords } from '@/lib/constants/onboarding'

export async function getOnboardingVenueCategories() {
  return prisma.category.findMany({
    where: {
      type: 'VENUE',
      slug: {
        notIn: [
          'explorar', 'eventos', 'locales', 'blog', 'ofertas',
          'rutas', 'colecciones', 'perfil', 'dashboard', 'admin',
          'auth', 'api', 'mejores',
        ],
      },
    },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      color: true,
      _count: {
        select: {
          venueCategories: { where: { venue: { status: 'APPROVED', isActive: true } } },
        },
      },
    },
  })
}

export async function getRecommendedVenuesForOnboarding(limit = 10) {
  const [featured, topRated, trending] = await Promise.all([
    prisma.venue.findMany({
      where: { status: 'APPROVED', isActive: true, featured: true },
      orderBy: { avgRating: 'desc' },
      take: 4,
      select: venueOnboardingSelect,
    }),
    prisma.venue.findMany({
      where: { status: 'APPROVED', isActive: true, avgRating: { gte: 4.0 }, reviewCount: { gte: 3 } },
      orderBy: [{ avgRating: 'desc' }, { reviewCount: 'desc' }],
      take: 4,
      select: venueOnboardingSelect,
    }),
    prisma.venue.findMany({
      where: { status: 'APPROVED', isActive: true, viewCount: { gte: 10 } },
      orderBy: { viewCount: 'desc' },
      take: 4,
      select: venueOnboardingSelect,
    }),
  ])

  const seen = new Set<string>()
  const merged = [...featured, ...topRated, ...trending].filter((v) => {
    if (seen.has(v.id)) return false
    seen.add(v.id)
    return true
  })

  return merged.slice(0, limit)
}

const venueOnboardingSelect = {
  id: true,
  name: true,
  slug: true,
  image: true,
  description: true,
  location: true,
  address: true,
  lat: true,
  lng: true,
  phone: true,
  website: true,
  priceRange: true,
  featured: true,
  avgRating: true,
  reviewCount: true,
  verified: true,
  badge: true,
  venueCategories: {
    select: {
      category: {
        select: { id: true, name: true, slug: true, icon: true, color: true },
      },
    },
  },
} as const

export async function getUserInterests(userId: string) {
  return prisma.userInterest.findMany({
    where: { userId },
    include: {
      category: {
        select: { id: true, name: true, slug: true, icon: true, color: true },
      },
    },
  })
}

export async function getUserLifestylePreferences(userId: string) {
  return prisma.userLifestylePreference.findMany({
    where: { userId },
    select: { preference: true },
  })
}

export async function getUserFollowingVenues(userId: string) {
  return prisma.userFollowingVenue.findMany({
    where: { userId },
    include: {
      venue: {
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          avgRating: true,
          reviewCount: true,
          venueCategories: {
            select: {
              category: { select: { id: true, name: true, icon: true } },
            },
          },
        },
      },
    },
  })
}

export async function getPersonalizedHomeData(userId: string) {
  const interests = await getUserInterests(userId)
  const preferences = await getUserLifestylePreferences(userId)
  const interestSlugs = interests.map((interest) => interest.category.slug)
  const lifestyleKeywords = getLifestyleKeywords(preferences.map(({ preference }) => preference))
  const categorySignals = await prisma.category.findMany({
    where: {
      OR: [
        ...(interestSlugs.length > 0 ? [{ slug: { in: interestSlugs } }] : []),
        ...lifestyleKeywords.flatMap((keyword) => [
          { slug: { contains: keyword, mode: 'insensitive' as const } },
          { name: { contains: keyword, mode: 'insensitive' as const } },
        ]),
      ],
    },
    select: { id: true },
  })
  const categoryIds = categorySignals.map(({ id }) => id)

  const [followingVenues, relatedEvents, relatedVenues] = await Promise.all([
    getUserFollowingVenues(userId),
    categoryIds.length > 0
      ? prisma.event.findMany({
          where: {
            status: 'APPROVED',
            startDate: { gte: new Date() },
            eventCategories: { some: { categoryId: { in: categoryIds } } },
          },
          orderBy: [{ featured: 'desc' }, { startDate: 'asc' }],
          take: 24,
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
            price: true,
            avgRating: true,
            reviewCount: true,
            featured: true,
            eventCategories: {
              select: { category: { select: { id: true, name: true, slug: true, icon: true, color: true } } },
            },
          },
        })
      : [],
    categoryIds.length > 0
      ? prisma.venue.findMany({
          where: {
            status: 'APPROVED',
            isActive: true,
            venueCategories: { some: { categoryId: { in: categoryIds } } },
          },
          orderBy: [{ featured: 'desc' }, { avgRating: 'desc' }],
          take: 24,
          select: venueOnboardingSelect,
        })
      : [],
  ])

  const normalizedInterests = interestSlugs.map(normalizeDiscoveryText)
  const normalizedKeywords = lifestyleKeywords.map(normalizeDiscoveryText)
  const scoreCategories = (categories: Array<{ category: { slug: string; name: string } }>) => {
    const values = categories.map(({ category }) => normalizeDiscoveryText(`${category.slug} ${category.name}`))
    return values.reduce((score, value) => {
      const interestScore = normalizedInterests.some((signal) => value.includes(signal)) ? 8 : 0
      const lifestyleScore = normalizedKeywords.filter((signal) => value.includes(signal)).length * 3
      return score + interestScore + lifestyleScore
    }, 0)
  }

  const rankedEvents = relatedEvents
    .sort((a, b) => {
      const scoreA = scoreCategories(a.eventCategories) + (a.featured ? 1 : 0)
      const scoreB = scoreCategories(b.eventCategories) + (b.featured ? 1 : 0)
      return scoreB - scoreA || a.startDate.getTime() - b.startDate.getTime()
    })
    .slice(0, 8)
  const rankedVenues = relatedVenues
    .sort((a, b) => {
      const scoreA = scoreCategories(a.venueCategories) + (a.featured ? 1 : 0) + (a.avgRating ?? 0) / 5
      const scoreB = scoreCategories(b.venueCategories) + (b.featured ? 1 : 0) + (b.avgRating ?? 0) / 5
      return scoreB - scoreA
    })
    .slice(0, 8)

  return { interests, preferences, followingVenues, relatedEvents: rankedEvents, relatedVenues: rankedVenues }
}

function normalizeDiscoveryText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es')
}

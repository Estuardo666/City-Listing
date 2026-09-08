import 'server-only'
import {
  mobileOpenNowCategories,
  mobileOpenNowDefaultExclusions,
  mobileOpenNowEligibility,
} from '@/lib/mobile-open-now'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { invalidateCache, withCache } from '@/lib/cache'
import { getPopularNow } from '@/lib/views'
import { isOpenInLoja, lojaDay, lojaNowParts } from '@/lib/loja-day'
import {
  parseSectionParams,
  type HomeSectionLayout,
  type HomeSectionParams,
  type HomeSectionPlatform,
  type HomeSectionType,
} from '@/schemas/home-section.schema'

/**
 * Resolves the configured home sections into ready-to-render payloads.
 *
 * The screen used to be a fixed list of keys (`featuredVenues`, `latestVenues`,
 * ...) duplicated in the web page and the iOS view. Here the composition lives
 * in the `HomeSection` table instead: order, visibility, titles and filters are
 * data, so a new carousel does not need an app release.
 */

/** One card, whatever the section that produced it. Mirrors `ExploreItem` on iOS. */
export type HomeItemDTO = {
  kind: 'venue' | 'event' | 'post' | 'route' | 'collection' | 'promotion' | 'category'
  id: string
  slug: string
  title: string
  subtitle?: string | null
  imageUrl?: string | null
  /** Derived server-side so the badge wording can change without an app release. */
  badge?: string | null
  priceLabel?: string | null
  rating?: number | null
  reviewCount?: number | null
  venueName?: string | null
  dateLabel?: string | null
  lat?: number | null
  lng?: number | null
  color?: string | null
  icon?: string | null
  categories?: { slug: string; name: string }[]
  excludedFromOpenNowDefault?: boolean
  deeplink: string
}

export type ResolvedHomeSection = {
  id: string
  type: HomeSectionType
  title: string
  subtitle: string | null
  actionLabel: string | null
  layout: HomeSectionLayout
  /** Where "Ver todo" leads, when the section has a natural full list. */
  deeplink: string | null
  body: string | null
  items: HomeItemDTO[]
}

const PATH_BY_KIND: Record<HomeItemDTO['kind'], string> = {
  venue: 'locales',
  event: 'eventos',
  post: 'blog',
  route: 'rutas',
  collection: 'colecciones',
  promotion: 'ofertas',
  category: '',
}

function deeplink(kind: HomeItemDTO['kind'], slug: string) {
  return kind === 'category' ? `/${slug}` : `/${PATH_BY_KIND[kind]}/${slug}`
}

const dateFormatter = new Intl.DateTimeFormat('es-EC', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'America/Guayaquil',
})

function eventPriceLabel(price: number | null | undefined) {
  if (price === null || price === undefined) return null
  return price <= 0 ? 'Gratis' : `De USD ${price.toFixed(2)}`
}

/** "Nuevo" for the first week, so the badge needs no manual upkeep. */
const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

// ---------------------------------------------------------------------------
// Selects
// ---------------------------------------------------------------------------

const venueCardSelect = Prisma.validator<Prisma.VenueSelect>()({
  id: true,
  name: true,
  slug: true,
  image: true,
  location: true,
  lat: true,
  lng: true,
  priceRange: true,
  avgRating: true,
  reviewCount: true,
  verified: true,
  featured: true,
  createdAt: true,
  promotions: {
    where: { status: 'ACTIVE' },
    take: 1,
    select: { id: true },
  },
})

const eventCardSelect = Prisma.validator<Prisma.EventSelect>()({
  id: true,
  title: true,
  slug: true,
  image: true,
  location: true,
  lat: true,
  lng: true,
  price: true,
  startDate: true,
  featured: true,
  avgRating: true,
  reviewCount: true,
  createdAt: true,
  venue: { select: { name: true } },
})

type VenueCard = Prisma.VenueGetPayload<{ select: typeof venueCardSelect }>
type EventCard = Prisma.EventGetPayload<{ select: typeof eventCardSelect }>

function mapVenueCard(venue: VenueCard, now: Date): HomeItemDTO {
  const isNew = now.getTime() - venue.createdAt.getTime() < NEW_WINDOW_MS
  return {
    kind: 'venue',
    id: venue.id,
    slug: venue.slug,
    title: venue.name,
    subtitle: venue.location,
    imageUrl: venue.image,
    badge: venue.promotions.length
      ? 'Con promoción'
      : isNew
        ? '¡Nuevo!'
        : venue.verified
          ? 'Verificado'
          : null,
    priceLabel: venue.priceRange,
    rating: venue.avgRating,
    reviewCount: venue.reviewCount,
    lat: venue.lat,
    lng: venue.lng,
    deeplink: deeplink('venue', venue.slug),
  }
}

function mapEventCard(event: EventCard, now: Date): HomeItemDTO {
  const isNew = now.getTime() - event.createdAt.getTime() < NEW_WINDOW_MS
  const soon = event.startDate.getTime() - now.getTime() < 48 * 60 * 60 * 1000
  return {
    kind: 'event',
    id: event.id,
    slug: event.slug,
    title: event.title,
    subtitle: event.location,
    imageUrl: event.image,
    badge: soon ? '¡Últimos días!' : isNew ? '¡Nuevo!' : null,
    priceLabel: eventPriceLabel(event.price),
    rating: event.avgRating,
    reviewCount: event.reviewCount,
    venueName: event.venue?.name ?? null,
    dateLabel: dateFormatter.format(event.startDate),
    lat: event.lat,
    lng: event.lng,
    deeplink: deeplink('event', event.slug),
  }
}

// ---------------------------------------------------------------------------
// Per-type resolvers
// ---------------------------------------------------------------------------

function venueOrderBy(
  sort: HomeSectionParams['venueList']['sort'],
): Prisma.VenueOrderByWithRelationInput[] {
  switch (sort) {
    case 'rating':
      return [{ avgRating: 'desc' }, { reviewCount: 'desc' }]
    case 'popular':
      return [{ viewCount: 'desc' }, { createdAt: 'desc' }]
    case 'featured':
      return [{ featured: 'desc' }, { createdAt: 'desc' }]
    default:
      return [{ createdAt: 'desc' }]
  }
}

async function resolveVenueList(params: HomeSectionParams['venueList'], now: Date) {
  const where: Prisma.VenueWhereInput = { status: 'APPROVED', isActive: true }
  if (params.categorySlug) where.venueCategories = { some: { category: { slug: params.categorySlug } } }
  if (params.featured) where.featured = true
  if (params.verified) where.verified = true
  if (params.hasPromotion) {
    where.promotions = { some: { status: 'ACTIVE', validFrom: { lte: now }, validUntil: { gte: now } } }
  }
  const venues = await prisma.venue.findMany({
    where,
    orderBy: venueOrderBy(params.sort),
    take: params.limit,
    select: venueCardSelect,
  })
  return venues.map((venue) => mapVenueCard(venue, now))
}

/**
 * Venues whose door is open right now, optionally narrowed to a curated set of
 * categories. Opening hours cannot be filtered in SQL — a window can cross
 * midnight — so the query narrows to the venues with hours for today or
 * yesterday and `isOpenInLoja` decides, the same rule the "Hoy en Loja" block
 * and the "abierto ahora" filter already use.
 */
async function resolveOpenNow(params: HomeSectionParams['openNow'], now: Date) {
  const { weekday, prevWeekday } = lojaNowParts(now)
  const where: Prisma.VenueWhereInput = {
    status: 'APPROVED',
    isActive: true,
    businessHours: { some: { isClosed: false, dayOfWeek: { in: [weekday, prevWeekday] } } },
  }
  if (params.categorySlugs?.length) {
    where.venueCategories = { some: { category: { slug: { in: params.categorySlugs } } } }
  }

  const candidates = await prisma.venue.findMany({
    where,
    orderBy: [{ featured: 'desc' }, { avgRating: 'desc' }, { id: 'asc' }],
    // Bounded: the filter below discards the ones that are closed right now.
    take: 200,
    select: { ...venueCardSelect, businessHours: true },
  })

  return candidates
    .filter((venue) => isOpenInLoja(venue.businessHours, now))
    .slice(0, params.limit)
    .map((venue) => mapVenueCard(venue, now))
}

async function resolveMobileOpenNow(now: Date): Promise<HomeItemDTO[]> {
  const { date, prevDate } = lojaNowParts(now)
  const venues = await prisma.venue.findMany({
    where: { status: 'APPROVED', isActive: true },
    orderBy: [{ featured: 'desc' }, { avgRating: 'desc' }, { id: 'asc' }],
    select: {
      ...venueCardSelect,
      businessHours: true,
      specialHours: { where: { date: { in: [new Date(`${date}T00:00:00Z`), new Date(`${prevDate}T00:00:00Z`)] } } },
      venueCategories: { select: { category: { select: { slug: true, name: true } } } },
    },
  })
  const eligible = venues.flatMap(venue => {
    const categories = mobileOpenNowCategories(
      venue.venueCategories.map(value => value.category),
      { name: venue.name, slug: venue.slug },
    )
    const eligibility = mobileOpenNowEligibility(venue.businessHours, categories, now,
      venue.specialHours.find(value => value.date.toISOString().slice(0, 10) === date),
      venue.specialHours.find(value => value.date.toISOString().slice(0, 10) === prevDate))
    return eligibility.include ? [{ item: { ...mapVenueCard(venue, now), categories }, eligibility }] : []
  })
  const exclusions = mobileOpenNowDefaultExclusions(eligible.map(value => value.eligibility))
  return eligible.map((value, index) => ({
    ...value.item,
    excludedFromOpenNowDefault: exclusions[index],
  }))
}

function eventDateWindow(range: HomeSectionParams['eventList']['dateRange'], now: Date) {
  if (range === 'all') return undefined
  const day = lojaDay(now)
  if (range === 'today') return { gte: now, lt: day.end }
  const days = range === 'week' ? 7 : 30
  return { gte: now, lt: new Date(day.end.getTime() + (days - 1) * 24 * 60 * 60 * 1000) }
}

async function resolveEventList(params: HomeSectionParams['eventList'], now: Date) {
  const where: Prisma.EventWhereInput = { status: 'APPROVED' }
  if (params.categorySlug) where.eventCategories = { some: { category: { slug: params.categorySlug } } }
  if (params.featured) where.featured = true
  const window = eventDateWindow(params.dateRange, now)
  if (window) where.startDate = window

  const orderBy: Prisma.EventOrderByWithRelationInput[] =
    params.sort === 'popular'
      ? [{ viewCount: 'desc' }]
      : params.sort === 'recent'
        ? [{ createdAt: 'desc' }]
        : params.sort === 'featured'
          ? [{ featured: 'desc' }, { startDate: 'asc' }]
          : [{ startDate: 'asc' }]

  const events = await prisma.event.findMany({ where, orderBy, take: params.limit, select: eventCardSelect })
  return events.map((event) => mapEventCard(event, now))
}

/** "Top 10 en Loja" - ranked by the shared view log, hydrated in rank order. */
async function resolveRanked(params: HomeSectionParams['ranked'], now: Date) {
  const ranking = await getPopularNow({ kind: params.kind, window: params.window, limit: params.limit })
  if (!ranking.length) return []
  const ids = ranking.map((row) => row.itemId)

  if (params.kind === 'venue') {
    const venues = await prisma.venue.findMany({
      where: { id: { in: ids }, status: 'APPROVED', isActive: true },
      select: venueCardSelect,
    })
    const byId = new Map(venues.map((venue) => [venue.id, venue]))
    return ids.flatMap((id) => {
      const venue = byId.get(id)
      return venue ? [mapVenueCard(venue, now)] : []
    })
  }

  const events = await prisma.event.findMany({
    where: { id: { in: ids }, status: 'APPROVED' },
    select: eventCardSelect,
  })
  const byId = new Map(events.map((event) => [event.id, event]))
  return ids.flatMap((id) => {
    const event = byId.get(id)
    return event ? [mapEventCard(event, now)] : []
  })
}

async function resolveCollection(params: HomeSectionParams['collection'], now: Date) {
  const collection = await prisma.collection.findFirst({
    where: { slug: params.slug, isPublic: true },
    select: {
      items: {
        orderBy: { order: 'asc' },
        take: params.limit,
        select: {
          note: true,
          venue: { select: venueCardSelect },
          event: { select: eventCardSelect },
          post: { select: { id: true, title: true, slug: true, image: true, excerpt: true } },
          route: { select: { id: true, title: true, slug: true, image: true, difficulty: true, days: true } },
        },
      },
    },
  })
  if (!collection) return []

  return collection.items.flatMap<HomeItemDTO>((item) => {
    if (item.venue) return [{ ...mapVenueCard(item.venue, now), subtitle: item.note ?? item.venue.location }]
    if (item.event) return [{ ...mapEventCard(item.event, now), subtitle: item.note ?? item.event.location }]
    if (item.post)
      return [
        {
          kind: 'post',
          id: item.post.id,
          slug: item.post.slug,
          title: item.post.title,
          subtitle: item.note ?? item.post.excerpt,
          imageUrl: item.post.image,
          deeplink: deeplink('post', item.post.slug),
        },
      ]
    if (item.route)
      return [
        {
          kind: 'route',
          id: item.route.id,
          slug: item.route.slug,
          title: item.route.title,
          subtitle: item.note ?? (item.route.days > 1 ? `${item.route.days} días` : item.route.difficulty),
          imageUrl: item.route.image,
          deeplink: deeplink('route', item.route.slug),
        },
      ]
    return []
  })
}

async function resolvePromotions(params: HomeSectionParams['promotions'], now: Date) {
  const promotions = await prisma.promotion.findMany({
    where: {
      status: 'ACTIVE',
      validFrom: { lte: now },
      validUntil: { gte: now },
      venue: { status: 'APPROVED', isActive: true },
    },
    orderBy: [{ featured: 'desc' }, { validUntil: 'asc' }],
    take: params.limit,
    select: {
      id: true,
      title: true,
      description: true,
      image: true,
      discount: true,
      validUntil: true,
      venue: { select: { name: true, slug: true, image: true } },
    },
  })
  return promotions.map<HomeItemDTO>((promotion) => ({
    kind: 'promotion',
    id: promotion.id,
    slug: promotion.venue.slug,
    title: promotion.title,
    subtitle: promotion.description,
    imageUrl: promotion.image ?? promotion.venue.image,
    badge: promotion.discount ? `${promotion.discount} de descuento` : 'Oferta',
    venueName: promotion.venue.name,
    dateLabel: `Hasta ${dateFormatter.format(promotion.validUntil)}`,
    // Promotions have no page of their own: the card opens the venue.
    deeplink: deeplink('venue', promotion.venue.slug),
  }))
}

async function resolvePosts(params: HomeSectionParams['posts']) {
  const where: Prisma.PostWhereInput = { status: 'APPROVED' }
  if (params.tagSlug) where.tags = { some: { tag: { slug: params.tagSlug } } }
  if (params.featured) where.featured = true
  const posts = await prisma.post.findMany({
    where,
    orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: params.limit,
    select: { id: true, title: true, slug: true, image: true, excerpt: true },
  })
  return posts.map<HomeItemDTO>((post) => ({
    kind: 'post',
    id: post.id,
    slug: post.slug,
    title: post.title,
    subtitle: post.excerpt,
    imageUrl: post.image,
    deeplink: deeplink('post', post.slug),
  }))
}

async function resolveRoutes(params: HomeSectionParams['routes']) {
  const routes = await prisma.route.findMany({
    where: { status: 'APPROVED', ...(params.featured ? { featured: true } : {}) },
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    take: params.limit,
    select: {
      id: true,
      title: true,
      slug: true,
      image: true,
      difficulty: true,
      days: true,
      estimatedMinutes: true,
    },
  })
  return routes.map<HomeItemDTO>((route) => ({
    kind: 'route',
    id: route.id,
    slug: route.slug,
    title: route.title,
    subtitle:
      route.days > 1
        ? `${route.days} días`
        : route.estimatedMinutes
          ? `${route.estimatedMinutes} min`
          : route.difficulty,
    imageUrl: route.image,
    deeplink: deeplink('route', route.slug),
  }))
}

async function resolveCategoryChips(params: HomeSectionParams['categoryChips']) {
  const categories = await prisma.category.findMany({
    where: params.categorySlugs?.length ? { slug: { in: params.categorySlugs } } : {},
    orderBy: { name: 'asc' },
    take: params.limit,
    select: { id: true, name: true, slug: true, icon: true, color: true },
  })
  // An explicit slug list is also an explicit order.
  const ordered = params.categorySlugs?.length
    ? params.categorySlugs.flatMap((slug) => categories.filter((category) => category.slug === slug))
    : categories
  return ordered.map<HomeItemDTO>((category) => ({
    kind: 'category',
    id: category.id,
    slug: category.slug,
    title: category.name,
    icon: category.icon,
    color: category.color,
    deeplink: deeplink('category', category.slug),
  }))
}

/** Curated mix: ids are hydrated per kind and returned in the configured order. */
async function resolveManual(params: HomeSectionParams['manual'], now: Date) {
  const idsByKind = {
    venue: params.items.filter((item) => item.kind === 'venue').map((item) => item.id),
    event: params.items.filter((item) => item.kind === 'event').map((item) => item.id),
    post: params.items.filter((item) => item.kind === 'post').map((item) => item.id),
    route: params.items.filter((item) => item.kind === 'route').map((item) => item.id),
  }
  const [venues, events, posts, routes] = await Promise.all([
    idsByKind.venue.length
      ? prisma.venue.findMany({
          where: { id: { in: idsByKind.venue }, status: 'APPROVED', isActive: true },
          select: venueCardSelect,
        })
      : [],
    idsByKind.event.length
      ? prisma.event.findMany({
          where: { id: { in: idsByKind.event }, status: 'APPROVED' },
          select: eventCardSelect,
        })
      : [],
    idsByKind.post.length
      ? prisma.post.findMany({
          where: { id: { in: idsByKind.post }, status: 'APPROVED' },
          select: { id: true, title: true, slug: true, image: true, excerpt: true },
        })
      : [],
    idsByKind.route.length
      ? prisma.route.findMany({
          where: { id: { in: idsByKind.route }, status: 'APPROVED' },
          select: { id: true, title: true, slug: true, image: true, difficulty: true, days: true },
        })
      : [],
  ])

  const map = new Map<string, HomeItemDTO>()
  venues.forEach((venue) => map.set(`venue:${venue.id}`, mapVenueCard(venue, now)))
  events.forEach((event) => map.set(`event:${event.id}`, mapEventCard(event, now)))
  posts.forEach((post) =>
    map.set(`post:${post.id}`, {
      kind: 'post',
      id: post.id,
      slug: post.slug,
      title: post.title,
      subtitle: post.excerpt,
      imageUrl: post.image,
      deeplink: deeplink('post', post.slug),
    }),
  )
  routes.forEach((route) =>
    map.set(`route:${route.id}`, {
      kind: 'route',
      id: route.id,
      slug: route.slug,
      title: route.title,
      subtitle: route.days > 1 ? `${route.days} días` : route.difficulty,
      imageUrl: route.image,
      deeplink: deeplink('route', route.slug),
    }),
  )

  return params.items.flatMap((item) => {
    const resolved = map.get(`${item.kind}:${item.id}`)
    return resolved ? [resolved] : []
  })
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type HomeSectionRow = {
  id: string
  type: string
  title: string
  subtitle: string | null
  actionLabel: string | null
  layout: string
  params: Prisma.JsonValue
  order: number
  isActive: boolean
  platform: string
  startsAt: Date | null
  endsAt: Date | null
}

const homeSectionSelect = {
  id: true,
  type: true,
  title: true,
  subtitle: true,
  actionLabel: true,
  layout: true,
  params: true,
  order: true,
  isActive: true,
  platform: true,
  startsAt: true,
  endsAt: true,
} satisfies Prisma.HomeSectionSelect

/** Every row, active or not - the admin list. */
export async function getAllHomeSections(): Promise<HomeSectionRow[]> {
  return prisma.homeSection.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    select: homeSectionSelect,
  })
}

/** Only what the given surface should render right now. */
export async function getActiveHomeSections(
  platform: Exclude<HomeSectionPlatform, 'all'>,
  now = new Date(),
): Promise<HomeSectionRow[]> {
  return prisma.homeSection.findMany({
    where: {
      isActive: true,
      platform: { in: ['all', platform] },
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    select: homeSectionSelect,
  })
}

/** Full-list destination for the sections that have one. */
function sectionDeeplink(type: HomeSectionType, params: unknown): string | null {
  switch (type) {
    case 'venueList': {
      const slug = (params as HomeSectionParams['venueList']).categorySlug
      return slug ? `/${slug}` : '/locales'
    }
    case 'openNow':
      return '/explorar'
    case 'eventList':
      return '/eventos'
    case 'ranked':
      return '/explorar'
    case 'collection':
      return `/colecciones/${(params as HomeSectionParams['collection']).slug}`
    case 'promotions':
      return '/ofertas'
    case 'posts':
      return '/blog'
    case 'routes':
      return '/rutas'
    case 'todayInLoja':
      return '/explorar'
    default:
      return null
  }
}

export async function resolveHomeSection(
  row: HomeSectionRow,
  now = new Date(),
  platform: Exclude<HomeSectionPlatform, 'all'> = 'web',
): Promise<ResolvedHomeSection | null> {
  const type = row.type as HomeSectionType
  const params = parseSectionParams(type, row.params)
  // An unknown type, or params that no longer validate, is skipped rather than
  // failing the whole screen.
  if (params === null) return null

  let items: HomeItemDTO[] = []
  switch (type) {
    case 'hero':
      break
    case 'todayInLoja':
      // Rendered by its own component on both clients; the row only decides
      // whether it appears and where.
      break
    case 'categoryChips':
      items = await resolveCategoryChips(params as HomeSectionParams['categoryChips'])
      break
    case 'venueList':
      items = await resolveVenueList(params as HomeSectionParams['venueList'], now)
      break
    case 'openNow':
      items = platform === 'ios' ? await resolveMobileOpenNow(now) : await resolveOpenNow(params as HomeSectionParams['openNow'], now)
      break
    case 'eventList':
      items = await resolveEventList(params as HomeSectionParams['eventList'], now)
      break
    case 'ranked':
      items = await resolveRanked(params as HomeSectionParams['ranked'], now)
      break
    case 'collection':
      items = await resolveCollection(params as HomeSectionParams['collection'], now)
      break
    case 'promotions':
      items = await resolvePromotions(params as HomeSectionParams['promotions'], now)
      break
    case 'posts':
      items = await resolvePosts(params as HomeSectionParams['posts'])
      break
    case 'routes':
      items = await resolveRoutes(params as HomeSectionParams['routes'])
      break
    case 'manual':
      items = await resolveManual(params as HomeSectionParams['manual'], now)
      break
    default:
      return null
  }

  const heroParams = type === 'hero' ? (params as HomeSectionParams['hero']) : null

  return {
    id: row.id,
    type,
    title: row.title,
    subtitle: row.subtitle,
    actionLabel: row.actionLabel,
    layout: row.layout as HomeSectionLayout,
    deeplink: heroParams?.ctaDeeplink ?? sectionDeeplink(type, params),
    body: heroParams?.body ?? null,
    items,
  }
}

const HOME_SECTIONS_TTL = 120

/**
 * Resolved sections for one surface. Sections that resolve to nothing are
 * dropped, so an empty carousel never reaches the client - except the two
 * item-less types the clients render themselves.
 */
export async function getResolvedHomeSections(
  platform: Exclude<HomeSectionPlatform, 'all'>,
): Promise<ResolvedHomeSection[]> {
  return withCache(
    `home:sections:${platform}`,
    async () => {
      const now = new Date()
      // Deploy order is not guaranteed: the code can reach production before the
      // `HomeSection` migration is applied. An empty list makes the clients fall
      // back to their built-in composition instead of failing the whole screen.
      let rows: HomeSectionRow[]
      try {
        rows = await getActiveHomeSections(platform, now)
      } catch (error) {
        console.error('[home-sections] no se pudieron leer las secciones', error)
        return []
      }
      const resolved = await Promise.all(rows.map((row) => resolveHomeSection(row, now, platform)))
      return resolved.filter(
        (section): section is ResolvedHomeSection =>
          section !== null &&
          (section.items.length > 0 || section.type === 'hero' || section.type === 'todayInLoja'),
      )
    },
    HOME_SECTIONS_TTL,
  )
}

/** Called by every write path so an edit shows up on the next request. */
export async function invalidateHomeSections() {
  await invalidateCache('home:sections:*')
}

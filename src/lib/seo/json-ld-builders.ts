import { getSchemaOrgType } from './schema-type-mapper'

const SITE_URL = 'https://viveloja.com'

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

type VenueForJsonLd = {
  name: string
  slug: string
  description: string
  phone: string | null
  email: string | null
  website: string | null
  image: string | null
  logo: string | null
  address: string | null
  location: string
  lat: number | null
  lng: number | null
  priceRange: string | null
  avgRating: number | null
  reviewCount: number
  venueCategories: Array<{ category: { name: string; slug: string } }>
  businessHours: Array<{
    dayOfWeek: number
    openTime: string
    closeTime: string
    isClosed: boolean
  }>
  services: Array<{ name: string }>
}

type EventForJsonLd = {
  status?: string
  title: string
  slug: string
  description: string
  content: string | null
  image: string | null
  startDate: Date
  endDate: Date | null
  location: string
  address: string | null
  lat: number | null
  lng: number | null
  price: number | null
  venue: {
    name: string
    slug: string
    address: string | null
    lat: number | null
    lng: number | null
  } | null
  user: { name: string | null }
  eventCategories: Array<{ category: { name: string } }>
  media: Array<{ url: string; type: string }>
}

type PostForJsonLd = {
  title: string
  slug: string
  excerpt: string | null
  content: string
  image: string | null
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
  user: { name: string | null; image: string | null }
  category: { name: string; slug: string } | null
}

function toAbsoluteUrl(url: string | null): string | undefined {
  if (!url) return undefined
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

function toIsoDate(date: Date | null | undefined): string | undefined {
  if (!date) return undefined
  return date.toISOString()
}

function buildPostalAddress(address: string | null) {
  const cleanAddress = (address || '')
    .replace(/,?\s*Loja\s*,?\s*Ecuador\s*$/i, '')
    .replace(/,?\s*Ecuador\s*$/i, '')
    .replace(/,?\s*Loja\s*$/i, '')
    .trim()

  return {
    '@type': 'PostalAddress',
    streetAddress: cleanAddress || undefined,
    addressLocality: 'Loja',
    addressRegion: 'Loja',
    addressCountry: 'EC',
  }
}

function buildOpeningHours(
  businessHours: VenueForJsonLd['businessHours'],
): Array<{
  '@type': 'OpeningHoursSpecification'
  dayOfWeek: string
  opens: string
  closes: string
}> {
  const specs: Array<{
    '@type': 'OpeningHoursSpecification'
    dayOfWeek: string
    opens: string
    closes: string
  }> = []

  for (const bh of businessHours) {
    if (bh.isClosed) continue
    specs.push({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: DAY_NAMES[bh.dayOfWeek],
      opens: bh.openTime,
      closes: bh.closeTime,
    })
  }

  return specs
}

export function buildLocalBusinessJsonLd(venue: VenueForJsonLd) {
  const schemaType = getSchemaOrgType(venue)
  const hasRatings = venue.avgRating !== null && venue.reviewCount > 0

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: venue.name,
    description: venue.description,
    url: `${SITE_URL}/locales/${venue.slug}`,
  }

  if (venue.phone) jsonLd.telephone = venue.phone
  if (venue.email) jsonLd.email = venue.email
  if (venue.website) jsonLd.url = venue.website

  const image = toAbsoluteUrl(venue.image)
  if (image) jsonLd.image = image

  const logo = toAbsoluteUrl(venue.logo)
  if (logo) jsonLd.logo = logo

  jsonLd.address = buildPostalAddress(venue.address)

  if (venue.lat !== null && venue.lng !== null) {
    jsonLd.geo = {
      '@type': 'GeoCoordinates',
      latitude: venue.lat,
      longitude: venue.lng,
    }
  }

  if (venue.priceRange) {
    jsonLd.priceRange = venue.priceRange
  }

  if (hasRatings) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: venue.avgRating,
      reviewCount: venue.reviewCount,
      bestRating: 5,
      worstRating: 1,
    }
  }

  const openingHours = buildOpeningHours(venue.businessHours)
  if (openingHours.length > 0) {
    jsonLd.openingHoursSpecification = openingHours
  }

  if (venue.services.length > 0) {
    jsonLd.hasOfferCatalog = {
      '@type': 'OfferCatalog',
      name: 'Servicios',
      itemListElement: venue.services.map((s) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: s.name,
        },
      })),
    }
  }

  jsonLd.sameAs = []

  return jsonLd
}

export function buildEventJsonLd(event: EventForJsonLd) {
  const image = toAbsoluteUrl(event.image)
  const images = image ? [image] : []
  for (const m of event.media) {
    if (m.type === 'IMAGE') {
      const abs = toAbsoluteUrl(m.url)
      if (abs && !images.includes(abs)) images.push(abs)
    }
  }

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description,
    startDate: toIsoDate(event.startDate),
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: event.status === 'CANCELLED' ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled',
    url: `${SITE_URL}/eventos/${event.slug}`,
  }

  if (event.endDate) {
    jsonLd.endDate = toIsoDate(event.endDate)
  }

  if (images.length > 0) {
    jsonLd.image = images
  }

  if (event.venue) {
    jsonLd.location = {
      '@type': 'Place',
      name: event.venue.name,
      url: `${SITE_URL}/locales/${event.venue.slug}`,
      address: buildPostalAddress(event.venue.address || event.address),
      ...(event.venue.lat !== null && event.venue.lng !== null
        ? {
            geo: {
              '@type': 'GeoCoordinates',
              latitude: event.venue.lat,
              longitude: event.venue.lng,
            },
          }
        : {}),
    }
  } else {
    jsonLd.location = {
      '@type': 'Place',
      name: event.location,
      address: buildPostalAddress(event.address),
      ...(event.lat !== null && event.lng !== null
        ? {
            geo: {
              '@type': 'GeoCoordinates',
              latitude: event.lat,
              longitude: event.lng,
            },
          }
        : {}),
    }
  }

  if (event.price !== null && event.price !== undefined) {
    jsonLd.offers = {
      '@type': 'Offer',
      price: String(event.price),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/eventos/${event.slug}`,
    }
  }

  return jsonLd
}

export function buildEventLandingJsonLd(params: {
  name: string
  description: string
  path: string
  events: Array<{
    title: string
    slug: string
    description?: string | null
    startDate: Date
    endDate?: Date | null
    image: string | null
    location: string
    address?: string | null
  }>
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: params.name,
    description: params.description,
    url: `${SITE_URL}/${params.path}`,
    inLanguage: 'es-EC',
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: {
      '@type': 'City',
      name: 'Loja',
      containedInPlace: { '@type': 'Country', name: 'Ecuador' },
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: params.events.length,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      itemListElement: params.events.slice(0, 20).map((event, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Event',
          name: event.title,
          url: `${SITE_URL}/eventos/${event.slug}`,
          ...(event.description ? { description: event.description } : {}),
          startDate: event.startDate.toISOString(),
          ...(event.endDate ? { endDate: event.endDate.toISOString() } : {}),
          location: {
            '@type': 'Place',
            name: event.location,
            ...(event.address ? { address: buildPostalAddress(event.address) } : {}),
          },
          ...(event.image ? { image: toAbsoluteUrl(event.image) } : {}),
        },
      })),
    },
  }
}

export function buildWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'Vive Loja',
        url: SITE_URL,
        logo: `${SITE_URL}/viveloja.png`,
        description: 'Agenda local de eventos, lugares y actividades de Loja, Ecuador.',
        areaServed: {
          '@type': 'City',
          name: 'Loja',
          containedInPlace: { '@type': 'Country', name: 'Ecuador' },
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: 'Vive Loja',
        url: SITE_URL,
        inLanguage: 'es-EC',
        description: 'Agenda local de eventos, lugares y actividades de Loja, Ecuador.',
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
    ],
  }
}

export function buildArticleJsonLd(post: PostForJsonLd) {
  const image = toAbsoluteUrl(post.image)

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${post.slug}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Vive Loja',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    datePublished: toIsoDate(post.publishedAt) || toIsoDate(post.createdAt),
    dateModified: toIsoDate(post.updatedAt),
  }

  if (image) {
    jsonLd.image = image
  }

  if (post.user.name) {
    jsonLd.author = {
      '@type': 'Person',
      name: post.user.name,
    }
  }

  if (post.excerpt) {
    jsonLd.description = post.excerpt
  }

  return jsonLd
}

export function buildVenueRankingJsonLd(params: {
  name: string
  description: string
  path: string
  venues: Array<{
    name: string
    slug: string
    image: string | null
    address: string | null
  }>
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: params.name,
    description: params.description,
    url: `${SITE_URL}/${params.path}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: params.venues.length,
      itemListElement: params.venues.map((venue, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'LocalBusiness',
          name: venue.name,
          url: `${SITE_URL}/locales/${venue.slug}`,
          ...(venue.image ? { image: toAbsoluteUrl(venue.image) } : {}),
          ...(venue.address ? { address: buildPostalAddress(venue.address) } : {}),
        },
      })),
    },
  }
}

export interface RouteForJsonLd {
  title: string
  slug: string
  description: string
  image?: string | null
  days: number
  estimatedMinutes?: number | null
  stops: Array<{
    title: string
    day: number
    order: number
    venue?: { name: string; slug: string; lat: number | null; lng: number | null } | null
  }>
}

/**
 * `TouristTrip` with one `itinerary` entry per stop. Multi-day itineraries are
 * still a single trip in schema.org terms; the day shows up in each stop's
 * position, which is what Google reads for the ordered list.
 */
export function buildTouristTripJsonLd(route: RouteForJsonLd) {
  const image = toAbsoluteUrl(route.image ?? null)
  const sorted = [...route.stops].sort((a, b) => a.day - b.day || a.order - b.order)

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: route.title,
    description: route.description,
    url: `${SITE_URL}/rutas/${route.slug}`,
    itinerary: {
      '@type': 'ItemList',
      numberOfItems: sorted.length,
      itemListElement: sorted.map((stop, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'TouristAttraction',
          name: stop.venue?.name ?? stop.title,
          ...(stop.venue ? { url: `${SITE_URL}/locales/${stop.venue.slug}` } : {}),
          ...(stop.venue?.lat != null && stop.venue?.lng != null
            ? {
                geo: {
                  '@type': 'GeoCoordinates',
                  latitude: stop.venue.lat,
                  longitude: stop.venue.lng,
                },
              }
            : {}),
        },
      })),
    },
  }

  if (image) jsonLd.image = image
  if (route.estimatedMinutes) {
    // ISO 8601 duration; schema.org has no "days" field for a trip.
    jsonLd.estimatedDuration = `PT${route.estimatedMinutes}M`
  }

  return jsonLd
}

export function buildBreadcrumbListJsonLd(
  items: Array<{ name: string; url?: string }>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => {
      const entry: Record<string, unknown> = {
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
      }
      if (item.url) entry.item = item.url
      return entry
    }),
  }
}

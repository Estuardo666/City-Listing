const SITE_URL = 'https://viveloja.com'

interface WatchEventSeoInput {
  name: string
  slug: string
  type: string
  description?: string | null
  matchDate: Date
  matchTime?: string | null
  competition?: string | null
  image?: string | null
  performers: string[]
}

export function generateSeoTitle(input: WatchEventSeoInput): string {
  const performersStr = input.performers.join(' vs ')
  return `Dónde ver ${performersStr} en Loja | Vive Loja`
}

export function generateSeoDescription(input: WatchEventSeoInput): string {
  const performersStr = input.performers.join(' vs ')
  const dateStr = input.matchDate.toLocaleDateString('es-EC', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const timeStr = input.matchTime || ''
  return `Descubre los mejores lugares para ver ${performersStr} en Loja. ${dateStr}${timeStr ? ` a las ${timeStr}` : ''}. Promociones, reservas y más.`
}

export function buildWatchEventJsonLd(input: WatchEventSeoInput & { venues?: Array<{ name: string; slug: string; address?: string | null; lat?: number | null; lng?: number | null }> }) {
  const isoDate = input.matchDate.toISOString()

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: input.name,
    description: input.description || `Transmisión de ${input.name} en Loja`,
    startDate: isoDate,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    url: `${SITE_URL}/partidos/${input.slug}`,
  }

  if (input.image) {
    jsonLd.image = input.image.startsWith('http') ? input.image : `${SITE_URL}${input.image}`
  }

  const performersList = input.performers
  if (performersList.length >= 2) {
    jsonLd.competitor = [
      { '@type': 'SportsTeam', name: performersList[0] },
      { '@type': 'SportsTeam', name: performersList[1] },
    ]
  } else if (performersList.length === 1) {
    jsonLd.performer = { '@type': 'PerformingGroup', name: performersList[0] }
  }

  if (input.venues && input.venues.length > 0) {
    jsonLd.location = input.venues.map((v) => ({
      '@type': 'Place',
      name: v.name,
      url: `${SITE_URL}/locales/${v.slug}`,
      address: {
        '@type': 'PostalAddress',
        streetAddress: v.address || undefined,
        addressLocality: 'Loja',
        addressRegion: 'Loja',
        addressCountry: 'EC',
      },
      ...(v.lat !== null && v.lng !== null
        ? { geo: { '@type': 'GeoCoordinates', latitude: v.lat, longitude: v.lng } }
        : {}),
    }))
  } else {
    jsonLd.location = {
      '@type': 'Place',
      name: 'Loja, Ecuador',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Loja',
        addressRegion: 'Loja',
        addressCountry: 'EC',
      },
    }
  }

  jsonLd.organizer = {
    '@type': 'Organization',
    name: 'Vive Loja',
    url: SITE_URL,
  }

  return jsonLd
}

export function buildSeoLandingJsonLd(
  input: WatchEventSeoInput,
  venues: Array<{
    name: string
    slug: string
    description: string
    address?: string | null
    lat?: number | null
    lng?: number | null
    avgRating?: number | null
    reviewCount: number
    phone?: string | null
    image?: string | null
  }>,
) {
  const siteEvent = buildWatchEventJsonLd({ ...input, venues })

  const venueItems = venues.map((v, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: {
      '@type': 'LocalBusiness',
      name: v.name,
      url: `${SITE_URL}/locales/${v.slug}`,
      description: v.description,
      image: v.image || undefined,
      telephone: v.phone || undefined,
      address: {
        '@type': 'PostalAddress',
        streetAddress: v.address || undefined,
        addressLocality: 'Loja',
        addressRegion: 'Loja',
        addressCountry: 'EC',
      },
      ...(v.avgRating !== null && v.reviewCount > 0
        ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: v.avgRating,
              reviewCount: v.reviewCount,
              bestRating: 5,
              worstRating: 1,
            },
          }
        : {}),
    },
  }))

  return {
    event: siteEvent,
    itemList: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Lugares para ver ${input.name} en Loja`,
      numberOfItems: venues.length,
      itemListElement: venueItems,
    },
  }
}

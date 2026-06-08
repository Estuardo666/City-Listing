type JsonLdProps = {
  data: Record<string, unknown>
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

const SITE_URL = 'https://viveloja.com'

export function buildCategoryJsonLd(params: {
  name: string
  slug: string
  description: string
  venues: Array<{
    name: string
    slug: string
    image: string | null
    avgRating: number | null
    reviewCount: number
    address: string | null
    phone: string | null
  }>
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: params.name,
    description: params.description,
    url: `${SITE_URL}/${params.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: params.venues.length,
      itemListElement: params.venues.slice(0, 20).map((v, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'LocalBusiness',
          name: v.name,
          url: `${SITE_URL}/locales/${v.slug}`,
          image: v.image ?? undefined,
          address: v.address ?? undefined,
          telephone: v.phone ?? undefined,
          aggregateRating:
            v.avgRating !== null && v.reviewCount > 0
              ? {
                  '@type': 'AggregateRating',
                  ratingValue: v.avgRating,
                  reviewCount: v.reviewCount,
                  bestRating: 5,
                  worstRating: 1,
                }
              : undefined,
        },
      })),
    },
  }
}

export function buildRankingJsonLd(params: {
  name: string
  slug: string
  venues: Array<{
    name: string
    slug: string
    image: string | null
    avgRating: number | null
    reviewCount: number
    address: string | null
    phone: string | null
  }>
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: params.name,
    url: `${SITE_URL}/mejores/${params.slug}`,
    numberOfItems: params.venues.length,
    itemListElement: params.venues.map((v, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'LocalBusiness',
        name: v.name,
        url: `${SITE_URL}/locales/${v.slug}`,
        image: v.image ?? undefined,
        address: v.address ?? undefined,
        telephone: v.phone ?? undefined,
        aggregateRating:
          v.avgRating !== null && v.reviewCount > 0
            ? {
                '@type': 'AggregateRating',
                ratingValue: v.avgRating,
                reviewCount: v.reviewCount,
                bestRating: 5,
                worstRating: 1,
              }
            : undefined,
      },
    })),
  }
}

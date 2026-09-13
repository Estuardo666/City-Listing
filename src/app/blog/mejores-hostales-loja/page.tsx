import type { Metadata } from 'next'
import { RankedVenueArticle } from '@/components/features/blog/ranked-venue-article'
import {
  RANKED_VENUE_ARTICLE_CONFIGS,
  countRankedVenueCandidates,
  getRankedVenues,
} from '@/lib/seo/ranked-venue-articles'

export const revalidate = 3600
const config = RANKED_VENUE_ARTICLE_CONFIGS.find((article) => article.slug === 'mejores-hostales-loja')!

export const metadata: Metadata = {
  title: config.title,
  description: config.description,
  alternates: { canonical: 'https://viveloja.com/blog/mejores-hostales-loja' },
  openGraph: { title: config.title, description: config.description, url: 'https://viveloja.com/blog/mejores-hostales-loja', type: 'article', locale: 'es_EC', siteName: 'Vive Loja' },
}

export default async function MejoresHostalesLojaPage() {
  const [venues, candidateCount] = await Promise.all([getRankedVenues(config), countRankedVenueCandidates(config)])
  return <RankedVenueArticle config={config} venues={venues} candidateCount={candidateCount} />
}

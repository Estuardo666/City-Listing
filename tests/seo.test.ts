import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildEventJsonLd,
  buildVenueRankingJsonLd,
} from '../src/lib/seo/json-ld-builders'
import { EVENT_LANDING_CONFIGS } from '../src/lib/seo/event-landings'
import { SEO_EDITORIAL_ARTICLES } from '../src/lib/seo/editorial-content'
import { RANKED_VENUE_ARTICLE_CONFIGS, RANKED_VENUE_ARTICLE_PATHS } from '../src/lib/seo/ranked-venue-articles'
import { displayableImageUrl } from '../src/lib/media/image-url'

test('public cards reject video files and retired Clearbit logos as images', () => {
  assert.equal(displayableImageUrl('https://cdn.example.com/event.mp4?token=abc'), null)
  assert.equal(displayableImageUrl('https://logo.clearbit.com/example.com'), null)
  assert.equal(displayableImageUrl('https://cdn.example.com/photo.webp'), 'https://cdn.example.com/photo.webp')
})

test('event JSON-LD omits an offer when the price is unknown', () => {
  const event = buildEventJsonLd({
    status: 'APPROVED',
    title: 'Evento de prueba',
    slug: 'evento-de-prueba',
    description: 'Descripción de prueba',
    content: null,
    image: null,
    startDate: new Date('2026-09-20T20:00:00.000Z'),
    endDate: null,
    location: 'Loja',
    address: null,
    lat: null,
    lng: null,
    price: null,
    venue: null,
    user: { name: 'Organizador' },
    eventCategories: [],
    media: [],
  })

  assert.equal('offers' in event, false)
})

test('cancelled events expose the cancelled schema status', () => {
  const event = buildEventJsonLd({
    status: 'CANCELLED',
    title: 'Evento cancelado',
    slug: 'evento-cancelado',
    description: 'Evento de prueba cancelado.',
    content: null,
    image: null,
    startDate: new Date('2026-09-20T20:00:00.000Z'),
    endDate: null,
    location: 'Loja',
    address: null,
    lat: null,
    lng: null,
    price: null,
    venue: null,
    user: { name: 'Organizador' },
    eventCategories: [],
    media: [],
  })

  assert.equal(event.eventStatus, 'https://schema.org/EventCancelled')
})

test('venue ranking JSON-LD describes the ranked list without inventing ratings', () => {
  const ranking = buildVenueRankingJsonLd({
    name: 'Mejores restaurantes de Loja',
    description: 'Restaurantes con valoraciones verificables.',
    path: 'blog/mejores-restaurantes-loja',
    venues: [
      { name: 'Local Uno', slug: 'local-uno', image: null, address: 'Centro, Loja' },
      { name: 'Local Dos', slug: 'local-dos', image: null, address: null },
    ],
  })

  assert.equal(ranking['@type'], 'CollectionPage')
  assert.equal(ranking.mainEntity['@type'], 'ItemList')
  assert.equal(ranking.mainEntity.numberOfItems, 2)
  assert.equal('aggregateRating' in ranking.mainEntity.itemListElement[0].item, false)
})

test('event landings and editorial articles keep their SEO source coverage', () => {
  assert.deepEqual(Object.keys(EVENT_LANDING_CONFIGS).sort(), [
    'arts',
    'concerts',
    'culture',
    'fiavl',
    'today',
    'weekend',
  ])

  assert.equal(SEO_EDITORIAL_ARTICLES.length, 12)
  assert.ok(SEO_EDITORIAL_ARTICLES.every((article) => article.image === null))
  assert.ok(SEO_EDITORIAL_ARTICLES.every((article) => article.content.some((paragraph) => paragraph.includes('https://'))))
  assert.ok(SEO_EDITORIAL_ARTICLES.every((article) => article.tags.length >= 2))
  assert.equal(RANKED_VENUE_ARTICLE_CONFIGS.length, 10)
  assert.ok(RANKED_VENUE_ARTICLE_CONFIGS.every((article) => article.title.includes('Loja')))
  assert.ok(RANKED_VENUE_ARTICLE_CONFIGS.every((article) => article.searchTerms && article.searchTerms.length > 0))
  assert.equal(RANKED_VENUE_ARTICLE_PATHS.length, 9)
  assert.equal(RANKED_VENUE_ARTICLE_CONFIGS.find((article) => article.slug === 'mejores-locales-deportivos-loja')?.indexable, false)
  assert.deepEqual(
    RANKED_VENUE_ARTICLE_CONFIGS
      .filter((article) => article.indexable !== false)
      .map((article) => article.slug)
      .sort(),
    [
      'mejores-bares-loja',
      'mejores-cafeterias-loja',
      'mejores-clinicas-loja',
      'mejores-gimnasios-loja',
      'mejores-hostales-loja',
      'mejores-hoteles-loja',
      'mejores-odontologos-loja',
      'mejores-pizzerias-loja',
      'mejores-restaurantes-loja',
    ],
  )
  assert.deepEqual(RANKED_VENUE_ARTICLE_CONFIGS.find((article) => article.slug === 'mejores-bares-loja')?.excludeTerms, [
    'dental',
    'protein',
    'nutricion',
    'fitness',
    'gimnasio',
    'farmacia',
  ])
  assert.equal(RANKED_VENUE_ARTICLE_CONFIGS.find((article) => article.slug === 'mejores-bares-loja')?.searchInNameOnly, true)
  assert.equal(RANKED_VENUE_ARTICLE_CONFIGS.find((article) => article.slug === 'mejores-pizzerias-loja')?.searchInNameOnly, true)
})

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { groupStopsByDay } from '../src/lib/mobile-routes'
import { buildTouristTripJsonLd } from '../src/lib/seo/json-ld-builders'
import { routeSchema, routeStopSchema } from '../src/schemas/route.schema'

describe('itinerary day grouping', () => {
  it('emits every day from 1 to days, including empty ones', () => {
    const grouped = groupStopsByDay({
      days: 3,
      stops: [
        { day: 1, id: 'a' },
        { day: 3, id: 'b' },
      ],
    })

    assert.deepEqual(
      grouped.map((entry) => entry.day),
      [1, 2, 3],
    )
    // Day 2 stays present and empty so the picker does not renumber day 3.
    assert.equal(grouped[1].stops.length, 0)
    assert.equal(grouped[2].stops[0].id, 'b')
  })

  it('extends past the declared span when a stop says so', () => {
    const grouped = groupStopsByDay({ days: 1, stops: [{ day: 4, id: 'z' }] })
    assert.equal(grouped.length, 4)
    assert.equal(grouped[3].stops[0].id, 'z')
  })

  it('treats a route with no stops as a single day', () => {
    assert.deepEqual(groupStopsByDay({ days: 0, stops: [] }), [{ day: 1, stops: [] }])
  })
})

describe('route schemas', () => {
  it('defaults a stop to day 1 so single-day routes are unchanged', () => {
    const parsed = routeStopSchema.parse({
      title: 'Parada',
      order: 0,
      venueId: '',
      notes: '',
      duration: '',
    })
    assert.equal(parsed.day, 1)
    assert.equal(parsed.venueId, null)
  })

  it('accepts HH:mm start times and rejects anything else', () => {
    assert.equal(
      routeStopSchema.parse({ title: 'x', order: 0, startTime: '09:30' }).startTime,
      '09:30',
    )
    assert.equal(routeStopSchema.safeParse({ title: 'x', order: 0, startTime: '9:30' }).success, false)
    assert.equal(routeStopSchema.safeParse({ title: 'x', order: 0, startTime: '24:00' }).success, false)
  })

  it('caps the itinerary span', () => {
    const base = {
      title: 'Centro histórico',
      description: 'Una ruta por el centro',
      content: '',
      image: '',
      duration: '',
      type: 'cultural',
    }
    assert.equal(routeSchema.parse(base).days, 1)
    assert.equal(routeSchema.parse({ ...base, days: 14 }).days, 14)
    assert.equal(routeSchema.safeParse({ ...base, days: 15 }).success, false)
  })
})

describe('TouristTrip JSON-LD', () => {
  it('orders stops across days and links the venues', () => {
    const jsonLd = buildTouristTripJsonLd({
      title: 'Dos días en Loja',
      slug: 'dos-dias-en-loja',
      description: 'Itinerario de dos días',
      days: 2,
      estimatedMinutes: 300,
      stops: [
        { title: 'Segundo día', day: 2, order: 0, venue: null },
        {
          title: 'Catedral',
          day: 1,
          order: 0,
          venue: { name: 'Catedral de Loja', slug: 'catedral', lat: -3.99, lng: -79.2 },
        },
      ],
    }) as {
      itinerary: { numberOfItems: number; itemListElement: { position: number; item: Record<string, unknown> }[] }
      estimatedDuration: string
    }

    assert.equal(jsonLd.itinerary.numberOfItems, 2)
    assert.equal(jsonLd.itinerary.itemListElement[0].position, 1)
    assert.equal(jsonLd.itinerary.itemListElement[0].item.name, 'Catedral de Loja')
    assert.equal(
      jsonLd.itinerary.itemListElement[0].item.url,
      'https://viveloja.com/locales/catedral',
    )
    // A custom stop without a venue keeps its own title and carries no url.
    assert.equal(jsonLd.itinerary.itemListElement[1].item.name, 'Segundo día')
    assert.equal(jsonLd.itinerary.itemListElement[1].item.url, undefined)
    assert.equal(jsonLd.estimatedDuration, 'PT300M')
  })
})

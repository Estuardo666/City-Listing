import assert from 'node:assert/strict'
import test from 'node:test'

import { formatExploreEventDate } from '../src/components/features/explore/explore-date'
import { nearestToLoja, resolveEventMapCoordinates } from '../src/lib/queries/explore-map-data'

test('explore event dates render in Loja time on both server and browser', () => {
  const eventStart = '2026-02-27T01:00:00.000Z'

  assert.equal(formatExploreEventDate(eventStart), '26 feb')
})

test('map events inherit coordinates from their linked venue', () => {
  assert.deepEqual(
    resolveEventMapCoordinates({ lat: null, lng: null, venue: { lat: -3.99, lng: -79.2 } }),
    { lat: -3.99, lng: -79.2 }
  )
})

test('home map prioritizes coordinate-bearing items nearest to Loja', () => {
  const selected = nearestToLoja([
    { id: 'vilcabamba', lat: -4.26, lng: -79.22 },
    { id: 'loja', lat: -3.994, lng: -79.205 },
  ], 1)

  assert.equal(selected[0]?.id, 'loja')
})

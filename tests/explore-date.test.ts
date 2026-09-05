import assert from 'node:assert/strict'
import test from 'node:test'

import { formatExploreEventDate } from '../src/components/features/explore/explore-date'

test('explore event dates render in Loja time on both server and browser', () => {
  const eventStart = '2026-02-27T01:00:00.000Z'

  assert.equal(formatExploreEventDate(eventStart), '26 feb')
})

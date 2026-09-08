import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  mobileOpenNowDefaultExclusions as defaultExclusions,
  mobileOpenNowEligibility as eligible,
} from '../src/lib/mobile-open-now'
const now = new Date('2026-09-07T19:00:00Z') // Monday, 14:00 Loja
const regular = [{ dayOfWeek: 1, openTime: '12:00', closeTime: '22:00', isClosed: false }]
const allDay = [{ ...regular[0], openTime: '00:00', closeTime: '00:00' }]
test('regular businesses require known, non-24-hour opening hours', () => {
  assert.equal(eligible(regular, [], now).include, true)
  assert.equal(eligible([], [], now).include, false)
  assert.equal(eligible(allDay, [], now).include, false)
  assert.equal(eligible([{ ...regular[0], isClosed: true }], [], now).include, false)
})
test('every category requires a known current schedule', () => {
  for (const slug of ['alojamiento', 'hoteles', 'salud', 'cafeterias']) {
    assert.equal(eligible(regular, [{ slug }], now).include, true)
    assert.equal(eligible([], [{ slug }], now).include, false)
    assert.equal(eligible([{ ...regular[0], isClosed: true }], [{ slug }], now).include, false)
  }
})
test('24-hour lodging and health are the default only when no standard venue is open', () => {
  const hotel24h = eligible(allDay, [{ slug: 'hoteles' }], now)
  const health24h = eligible(allDay, [{ slug: 'salud-bienestar' }], now)
  const standard = eligible(regular, [{ slug: 'cafeterias' }], now)

  assert.equal(hotel24h.is24HourFallback, true)
  assert.equal(health24h.is24HourFallback, true)
  assert.deepEqual(defaultExclusions([hotel24h, health24h]), [false, false])
  assert.deepEqual(defaultExclusions([standard, hotel24h, health24h]), [false, true, true])
  assert.deepEqual(defaultExclusions([standard]), [false])
})
test('a mixed-category venue counts as standard', () => {
  const mixed = eligible(regular, [{ slug: 'hoteles' }, { slug: 'restaurantes' }], now)
  assert.equal(mixed.excludedFromDefault, false)
  assert.deepEqual(defaultExclusions([mixed]), [false])
})
test('overnight windows and special closures use Loja time', () => {
  const overnight = [{ dayOfWeek: 0, openTime: '22:00', closeTime: '02:00', isClosed: false }]
  assert.equal(eligible(overnight, [], new Date('2026-09-07T06:00:00Z')).include, true)
  assert.equal(eligible(regular, [], now, { isClosed: true, openTime: null, closeTime: null }).include, false)
  assert.equal(eligible([], [{ slug: 'salud' }], now, { isClosed: true, openTime: null, closeTime: null }).include, false)
})

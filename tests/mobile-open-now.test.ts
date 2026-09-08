import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mobileOpenNowEligibility as eligible } from '../src/lib/mobile-open-now'
const now = new Date('2026-09-07T19:00:00Z') // Monday, 14:00 Loja
const regular = [{ dayOfWeek: 1, openTime: '12:00', closeTime: '22:00', isClosed: false }]
const allDay = [{ ...regular[0], openTime: '00:00', closeTime: '00:00' }]
test('regular businesses require known, non-24-hour opening hours', () => {
  assert.equal(eligible(regular, [], now).include, true)
  assert.equal(eligible([], [], now).include, false)
  assert.equal(eligible(allDay, [], now).include, false)
  assert.equal(eligible([{ ...regular[0], isClosed: true }], [], now).include, false)
})
test('lodging and health are selectable exceptions excluded from default', () => {
  for (const slug of ['alojamiento', 'hoteles', 'salud']) {
    for (const hours of [regular, allDay, []]) {
      assert.deepEqual(eligible(hours, [{ slug }], now), { include: true, excludedFromDefault: true })
    }
    assert.equal(eligible([{ ...regular[0], isClosed: true }], [{ slug }], now).include, false)
  }
})
test('overnight windows and special closures use Loja time', () => {
  const overnight = [{ dayOfWeek: 0, openTime: '22:00', closeTime: '02:00', isClosed: false }]
  assert.equal(eligible(overnight, [], new Date('2026-09-07T06:00:00Z')).include, true)
  assert.equal(eligible(regular, [], now, { isClosed: true, openTime: null, closeTime: null }).include, false)
  assert.equal(eligible([], [{ slug: 'salud' }], now, { isClosed: true, openTime: null, closeTime: null }).include, false)
})

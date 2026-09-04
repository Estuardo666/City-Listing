import assert from 'node:assert/strict'
import test from 'node:test'
import { isOpenInLoja, lojaDay } from '../src/lib/loja-day'

test('Loja midnight is 05:00 UTC regardless of host timezone', () => {
  assert.equal(lojaDay(new Date('2026-09-04T04:59:59Z')).date, '2026-09-03')
  const day = lojaDay(new Date('2026-09-04T05:00:00Z'))
  assert.equal(day.date, '2026-09-04')
  assert.equal(day.weekday, 5)
  assert.equal(day.end.toISOString(), '2026-09-05T05:00:00.000Z')
})

test('business hours handle overnight, split shifts, closing boundary and unknown hours', () => {
  const hours = [{ dayOfWeek: 4, openTime: '22:00', closeTime: '02:00', isClosed: false }]
  assert.equal(isOpenInLoja(hours, new Date('2026-09-04T06:00:00Z')), true)
  assert.equal(isOpenInLoja(hours, new Date('2026-09-04T07:00:00Z')), false)
  assert.equal(isOpenInLoja(hours, new Date('2026-09-04T02:00:00Z')), false)
  assert.equal(isOpenInLoja([], new Date()), false)
  assert.equal(isOpenInLoja([{ ...hours[0], isClosed: true }], new Date('2026-09-04T06:00:00Z')), false)
  assert.equal(isOpenInLoja([{ ...hours[0], openTime: 'bad' }], new Date('2026-09-04T06:00:00Z')), false)
  const split = [ { dayOfWeek: 5, openTime: '08:00', closeTime: '12:00', isClosed: false },
    { dayOfWeek: 5, openTime: '14:00', closeTime: '18:00', isClosed: false } ]
  assert.equal(isOpenInLoja(split, new Date('2026-09-04T18:00:00Z')), false)
  assert.equal(isOpenInLoja(split, new Date('2026-09-04T19:00:00Z')), true)
})

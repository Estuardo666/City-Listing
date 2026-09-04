import assert from 'node:assert/strict'
import test from 'node:test'
import { isOpenInLoja, lojaDay } from '../src/lib/loja-day'
import { agendaWindow } from '../src/lib/agenda-window'
import { eventUpdateMessage } from '../src/lib/event-update-message'

test('agenda uses Loja days, includes the remaining weekend and crosses month boundaries', () => {
  const friday = new Date('2026-09-04T23:00:00Z')
  assert.equal(agendaWindow('today', friday).start.toISOString(), friday.toISOString())
  assert.equal(agendaWindow('tomorrow', friday).start.toISOString(), '2026-09-05T05:00:00.000Z')
  assert.equal(agendaWindow('weekend', friday).end.toISOString(), '2026-09-07T05:00:00.000Z')
  const sunday = new Date('2026-09-06T19:00:00Z')
  assert.equal(agendaWindow('weekend', sunday).start.toISOString(), sunday.toISOString())
  assert.equal(agendaWindow('weekend', sunday).end.toISOString(), '2026-09-07T05:00:00.000Z')
  assert.equal(agendaWindow('tomorrow', new Date('2026-12-31T23:00:00Z')).start.toISOString(), '2027-01-01T05:00:00.000Z')
})

test('event notices distinguish cancellation and schedule changes from unrelated edits', () => {
  const before = { title: 'Concierto', status: 'APPROVED', startDate: new Date('2026-09-04T23:00:00Z'), endDate: null }
  assert.equal(eventUpdateMessage(before, { ...before, title: 'Nuevo título' }), null)
  assert.equal(eventUpdateMessage(before, { ...before, status: 'CANCELLED' })?.title, 'Evento cancelado')
  assert.equal(eventUpdateMessage({ ...before, status: 'CANCELLED' }, { ...before, status: 'CANCELLED' }), null)
  const changed = eventUpdateMessage(before, { ...before, startDate: new Date('2026-09-05T23:00:00Z') })
  assert.equal(changed?.title, 'Cambio de fecha u horario')
  assert.match(changed!.body, /18:00/)
  assert.ok(eventUpdateMessage(before, { ...before, endDate: new Date('2026-09-05T02:00:00Z') }))
})

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

import assert from 'node:assert/strict'
import test from 'node:test'
import { openStatus, lojaNowParts, parseHHMM, formatHHMM } from '../src/lib/loja-day'

// 2026-09-04T20:00:00Z = viernes 15:00 en Loja (UTC-5). weekday 5.
const friday15 = new Date('2026-09-04T20:00:00Z')
// 2026-09-05T06:00:00Z = sabado 01:00 en Loja. weekday 6, dia anterior 5.
const saturday01 = new Date('2026-09-05T06:00:00Z')

test('la hora de Loja no depende de la zona horaria del servidor', () => {
  const parts = lojaNowParts(friday15)
  assert.equal(parts.weekday, 5)
  assert.equal(parts.minute, 15 * 60)
  assert.equal(parts.prevWeekday, 4)
  assert.equal(parts.date, '2026-09-04')
  assert.equal(parts.prevDate, '2026-09-03')
  assert.equal(parseHHMM('20:30'), 1230)
  assert.equal(parseHHMM('9:00'), null)
  assert.equal(formatHHMM(1500), '01:00')
})

test('horario que cruza medianoche cuenta como abierto antes y despues de las 00:00', () => {
  const bar = [{ dayOfWeek: 5, openTime: '20:00', closeTime: '02:00', isClosed: false }]
  // Viernes 15:00: aun no abre.
  assert.equal(openStatus(bar, { now: friday15 }).isOpen, false)
  assert.equal(openStatus(bar, { now: friday15 }).opensAt, '20:00')
  // Viernes 21:00 en Loja.
  assert.equal(openStatus(bar, { now: new Date('2026-09-05T02:00:00Z') }).isOpen, true)
  // Sabado 01:00: sigue abierto por el horario del viernes.
  const overnight = openStatus(bar, { now: saturday01 })
  assert.equal(overnight.isOpen, true)
  assert.equal(overnight.closesAt, '02:00')
  // Sabado 03:00: ya cerro.
  assert.equal(openStatus(bar, { now: new Date('2026-09-05T08:00:00Z') }).isOpen, false)
})

test('horario partido, 24 horas, cerrado y datos invalidos', () => {
  const split = [
    { dayOfWeek: 5, openTime: '08:00', closeTime: '12:00', isClosed: false },
    { dayOfWeek: 5, openTime: '14:00', closeTime: '18:00', isClosed: false },
  ]
  assert.equal(openStatus(split, { now: friday15 }).isOpen, true)
  assert.equal(openStatus(split, { now: friday15 }).closesAt, '18:00')
  // 13:00 en Loja: entre turnos.
  const between = openStatus(split, { now: new Date('2026-09-04T18:00:00Z') })
  assert.equal(between.isOpen, false)
  assert.equal(between.opensAt, '14:00')

  const allDay = [{ dayOfWeek: 5, openTime: '00:00', closeTime: '00:00', isClosed: false }]
  assert.equal(openStatus(allDay, { now: friday15 }).isOpen, true)

  assert.equal(openStatus([{ dayOfWeek: 5, openTime: '08:00', closeTime: '18:00', isClosed: true }], { now: friday15 }).isOpen, false)
  assert.equal(openStatus([{ dayOfWeek: 5, openTime: 'Abierto', closeTime: '18:00', isClosed: false }], { now: friday15 }).isOpen, false)
  assert.equal(openStatus([], { now: friday15 }).isOpen, false)
})

test('el horario especial del dia sustituye al horario regular', () => {
  const regular = [{ dayOfWeek: 5, openTime: '08:00', closeTime: '18:00', isClosed: false }]
  // Feriado: cerrado aunque el horario regular diga abierto.
  assert.equal(openStatus(regular, { now: friday15, specialToday: { openTime: null, closeTime: null, isClosed: true } }).isOpen, false)
  // Horario reducido que ya termino.
  assert.equal(openStatus(regular, { now: friday15, specialToday: { openTime: '08:00', closeTime: '13:00', isClosed: false } }).isOpen, false)
  // Horario extendido en un dia donde no hay horario regular.
  assert.equal(openStatus([], { now: friday15, specialToday: { openTime: '10:00', closeTime: '22:00', isClosed: false } }).isOpen, true)
  // Horario especial de ayer que cruza medianoche.
  assert.equal(openStatus([], { now: saturday01, specialYesterday: { openTime: '20:00', closeTime: '03:00', isClosed: false } }).isOpen, true)
})

test('cuando esta cerrado indica la proxima apertura, incluso en otro dia', () => {
  const onlyMonday = [{ dayOfWeek: 1, openTime: '09:00', closeTime: '17:00', isClosed: false }]
  const state = openStatus(onlyMonday, { now: friday15 })
  assert.equal(state.isOpen, false)
  assert.equal(state.opensAt, '09:00')
  assert.equal(openStatus([], { now: friday15 }).opensAt, undefined)
})

// ── Paginacion ──
import { pageSlice } from '../src/lib/explore-page'

const rows = (n: number, from = 0) => Array.from({ length: n }, (_, i) => ({ id: `v${from + i}` }))

test('sin post-filtro el cursor avanza exactamente una pagina', () => {
  const take = 60
  const first = pageSlice(rows(61), rows(61), take, take + 1)
  assert.equal(first.items.length, 60)
  assert.equal(first.consumed, 60)
  assert.equal(first.hasMore, true)

  const last = pageSlice(rows(20, 60), rows(20, 60), take, take + 1)
  assert.equal(last.consumed, 20)
  assert.equal(last.hasMore, false)
})

test('con post-filtro el cursor apunta a la primera fila no usada, sin repetir', () => {
  const take = 5
  const read = rows(20)
  // Solo sobreviven las filas pares: 10 items de 20 filas leidas.
  const filtered = read.filter((_, i) => i % 2 === 0)
  const page = pageSlice(read, filtered, take, 20)
  assert.deepEqual(page.items.map((r) => r.id), ['v0', 'v2', 'v4', 'v6', 'v8'])
  // El ultimo devuelto es la fila 8: la siguiente pagina arranca en la 9.
  assert.equal(page.consumed, 9)
  assert.equal(page.hasMore, true)

  // Segunda pagina simulada desde skip = 9: sin ids repetidos.
  const nextRead = rows(11, 9)
  const nextPage = pageSlice(nextRead, nextRead.filter((_, i) => i % 2 === 1), take, 20)
  const seen = new Set(page.items.map((r) => r.id))
  assert.equal(nextPage.items.some((r) => seen.has(r.id)), false)
})

test('la lista no se corta antes de tiempo cuando el post-filtro deja pocos items', () => {
  const take = 60
  const read = rows(100)
  // Solo 3 abiertos entre 100 filas leidas: quedan mas paginas por revisar.
  const filtered = [read[10], read[40], read[90]]
  const page = pageSlice(read, filtered, take, 100)
  assert.equal(page.items.length, 3)
  assert.equal(page.consumed, 91)
  assert.equal(page.hasMore, true)
})

test('sin resultados el cursor consume todo lo leido', () => {
  const read = rows(100)
  const page = pageSlice(read, [], 60, 100)
  assert.equal(page.items.length, 0)
  assert.equal(page.consumed, 100)
  assert.equal(page.hasMore, true)
  assert.equal(pageSlice(rows(10), [], 60, 61).hasMore, false)
})

import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { AgendaCard } from '../src/components/features/events/agenda'

test('agenda cards keep date and price metadata when artwork is missing', () => {
  const markup = renderToStaticMarkup(
    React.createElement(AgendaCard, {
      event: {
        id: 'event-without-artwork',
        slug: 'event-without-artwork',
        title: 'Evento sin fotografía',
        image: null,
        startDate: '2026-09-18T17:30:00.000Z',
        location: 'Centro de Loja',
        price: 0,
      },
    }),
  )

  const dateLabel = new Intl.DateTimeFormat('es-EC', {
    timeZone: 'America/Guayaquil',
    weekday: 'short',
    day: 'numeric',
  }).format(new Date('2026-09-18T17:30:00.000Z'))

  assert.match(markup, new RegExp(dateLabel.replace('.', '\\.')))
  assert.match(markup, /Gratis/)
})

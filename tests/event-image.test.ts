import assert from 'node:assert/strict'
import test from 'node:test'
import { displayableEventImageUrl } from '../src/lib/media/event-image'

test('rejects stock images for events', () => {
  assert.equal(displayableEventImageUrl('https://images.unsplash.com/photo-123?w=800'), null)
  assert.equal(displayableEventImageUrl('https://www.unsplash.com/photo-123?w=800'), null)
})

test('keeps source artwork and local uploads', () => {
  assert.equal(
    displayableEventImageUrl('https://res.cloudinary.com/cinemasloja/image/upload/poster.webp'),
    'https://res.cloudinary.com/cinemasloja/image/upload/poster.webp',
  )
  assert.equal(displayableEventImageUrl('/uploads/event.webp'), '/uploads/event.webp')
})

test('rejects missing and non-image media', () => {
  assert.equal(displayableEventImageUrl(null), null)
  assert.equal(displayableEventImageUrl('https://cdn.example.com/event.mp4'), null)
})

import { getVenues } from '@/lib/queries/venues'
import { getEvents } from '@/lib/queries/events'
import { HomeCategoriesGrid } from './home-categories-grid'

export async function HomeCategoriesGridSection() {
  const HERO_MAP_LIMIT = 80

  const [venueList, eventList] = await Promise.all([
    getVenues({ status: 'APPROVED' }, HERO_MAP_LIMIT),
    getEvents({ status: 'APPROVED' }, HERO_MAP_LIMIT),
  ])

  // Build categories with counts
  const categoryCountMap = new Map<string, { name: string; icon: string | null; slug: string; count: number }>()
  for (const v of venueList) {
    const key = v.category.name
    const existing = categoryCountMap.get(key)
    if (existing) existing.count++
    else categoryCountMap.set(key, { name: v.category.name, icon: v.category.icon, slug: v.category.slug, count: 1 })
  }
  for (const e of eventList) {
    const key = e.category.name
    const existing = categoryCountMap.get(key)
    if (existing) existing.count++
    else categoryCountMap.set(key, { name: e.category.name, icon: e.category.icon, slug: e.category.slug, count: 1 })
  }
  // Tomamos hasta 10 categorías para formar un grid perfecto de 5x2 o 2x5
  const categories = Array.from(categoryCountMap.values()).slice(0, 10)

  return <HomeCategoriesGrid categories={categories} />
}

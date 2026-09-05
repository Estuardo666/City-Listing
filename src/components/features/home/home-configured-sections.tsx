import { Suspense, type ReactNode } from 'react'
import { getResolvedHomeSections } from '@/lib/queries/home-sections'
import { TodayInLoja } from './today-in-loja'
import { HomeCategoriesGridSection } from './home-categories-grid-section'
import { HomeCategoriesGridSkeleton } from './home-categories-grid-skeleton'
import { HomeConfiguredSection } from './home-configured-section'

/**
 * The website's server-driven home: the same `HomeSection` rows the app reads,
 * rendered in the configured order.
 *
 * Two types keep their bespoke components because they are richer than a list
 * of cards — "Hoy en Loja" computes opening hours, and the category grid has its
 * own art. Everything else goes through the generic renderer.
 */
export async function HomeConfiguredSections({ fallback }: { fallback: ReactNode }) {
  const sections = await getResolvedHomeSections('web')
  // Nothing configured (or the table is not there yet): the caller's fixed stack
  // renders instead, so the homepage can never end up empty.
  if (!sections.length) return <>{fallback}</>

  return (
    <>
      {sections.map((section) => {
        if (section.type === 'todayInLoja') return <TodayInLoja key={section.id} />
        if (section.type === 'categoryChips') {
          return (
            <Suspense key={section.id} fallback={<HomeCategoriesGridSkeleton />}>
              <HomeCategoriesGridSection />
            </Suspense>
          )
        }
        return <HomeConfiguredSection key={section.id} section={section} />
      })}
    </>
  )
}

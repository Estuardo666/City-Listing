import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowRight, Compass, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MotionDiv, fadeInUp, viewportOnce } from '@/components/ui/motion'
import { HomeCategoriesGridSection } from '@/components/features/home/home-categories-grid-section'
import { HomeFeaturedEventsSection } from '@/components/features/home/home-featured-events-section'
import { HomeLatestVenuesSection } from '@/components/features/home/home-latest-venues-section'
import { HomeFeaturedVenuesSection } from '@/components/features/home/home-featured-venues-section'
import { HomePromoGridSection } from '@/components/features/home/home-promo-grid-section'
import { HomeRelatedEventsSection } from '@/components/features/home/home-related-events-section'
import { HomeHeroMapSection } from '@/components/features/home/home-hero-map-section'
import { HomeBlogSection } from '@/components/features/home/home-blog-section'
import { HomeHeroMapSkeleton } from '@/components/features/home/home-hero-map-skeleton'
import { HomeCategoriesGridSkeleton } from '@/components/features/home/home-categories-grid-skeleton'
import { HomeFeaturedEventsSkeleton } from '@/components/features/home/home-featured-events-skeleton'
import { HomeLatestVenuesSkeleton } from '@/components/features/home/home-latest-venues-skeleton'
import { HomeFeaturedVenuesSkeleton } from '@/components/features/home/home-featured-venues-skeleton'
import { HomePromoGridSkeleton } from '@/components/features/home/home-promo-grid-skeleton'
import { HomeRelatedEventsSkeleton } from '@/components/features/home/home-related-events-skeleton'
import { HomeBlogSkeleton } from '@/components/features/home/home-blog-skeleton'

// Revalidate every 1 hour for ISR (Incremental Static Regeneration)
export const revalidate = 3600

export default function HomePage() {

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20">
      <main className="space-y-16 sm:space-y-20">
        {/* Hero Map with Suspense - Loads in parallel, shows skeleton while loading */}
        <Suspense fallback={<HomeHeroMapSkeleton />}>
          <HomeHeroMapSection />
        </Suspense>

        <div className="section-shell space-y-20 sm:space-y-24">
          {/* Categories Grid with Suspense */}
          <Suspense fallback={<HomeCategoriesGridSkeleton />}>
            <HomeCategoriesGridSection />
          </Suspense>

          {/* Featured Events with Suspense */}
          <Suspense fallback={<HomeFeaturedEventsSkeleton />}>
            <HomeFeaturedEventsSection />
          </Suspense>

          {/* Latest Venues with Suspense */}
          <Suspense fallback={<HomeLatestVenuesSkeleton />}>
            <HomeLatestVenuesSection />
          </Suspense>

          {/* Featured Venues with Suspense */}
          <Suspense fallback={<HomeFeaturedVenuesSkeleton />}>
            <HomeFeaturedVenuesSection />
          </Suspense>

          {/* Promo Grid with Suspense */}
          <Suspense fallback={<HomePromoGridSkeleton />}>
            <HomePromoGridSection />
          </Suspense>

          {/* Related Events with Suspense */}
          <Suspense fallback={<HomeRelatedEventsSkeleton />}>
            <HomeRelatedEventsSection />
          </Suspense>

          {/* Blog Section with Suspense */}
          <Suspense fallback={<HomeBlogSkeleton />}>
            <HomeBlogSection />
          </Suspense>

          {/* CTA final */}
          <section className="rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-accent to-primary/5 px-6 py-10 sm:px-10 sm:py-14">
            <MotionDiv {...fadeInUp} viewport={viewportOnce} className="space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/70 px-3 py-1 text-xs font-semibold text-primary">
                <Compass className="h-3.5 w-3.5" />
                Para negocios y organizadores
              </span>
              <h3 className="max-w-2xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                ¿Tienes un local o evento? Loja te está buscando. 📣
              </h3>
              <p className="max-w-xl text-base text-muted-foreground">
                Publica gratis, aparece en el mapa y llega a personas que ya quieren salir. Sin complicaciones.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild className="h-12 rounded-xl px-7 text-base">
                  <Link href="/auth/signup">Publicar gratis 🚀</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-12 rounded-xl px-7 text-base">
                  <Link href="/explorar">
                    Explorar el mapa <Search className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </MotionDiv>
          </section>
        </div>
      </main>
    </div>
  )
}

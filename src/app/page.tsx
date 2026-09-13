import { Suspense } from 'react'
import { TodayInLoja } from '@/components/features/home/today-in-loja'
import { getServerSession } from 'next-auth'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Compass, Search } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { getPersonalizedHomeData } from '@/lib/queries/onboarding'
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
import { HomeAppCta } from '@/components/features/home/home-app-cta'
import { HomeHeroMapSkeleton } from '@/components/features/home/home-hero-map-skeleton'
import { HomeCategoriesGridSkeleton } from '@/components/features/home/home-categories-grid-skeleton'
import { HomeFeaturedEventsSkeleton } from '@/components/features/home/home-featured-events-skeleton'
import { HomeLatestVenuesSkeleton } from '@/components/features/home/home-latest-venues-skeleton'
import { HomeFeaturedVenuesSkeleton } from '@/components/features/home/home-featured-venues-skeleton'
import { HomePromoGridSkeleton } from '@/components/features/home/home-promo-grid-skeleton'
import { HomeRelatedEventsSkeleton } from '@/components/features/home/home-related-events-skeleton'
import { HomeBlogSkeleton } from '@/components/features/home/home-blog-skeleton'
import { HomePersonalizedSection } from '@/components/features/home/home-personalized-section'
import { HomeConfiguredSections } from '@/components/features/home/home-configured-sections'
import { PricingCards } from '@/components/billing/pricing-cards'
import { getPublishedCatalog } from '@/lib/billing/plans'

// Revalidate every 1 hour for ISR (Incremental Static Regeneration)
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Vive Loja - Descubre Eventos, Locales y Noticias de tu Ciudad',
  description: 'Explora los mejores eventos, restaurantes, bares, locales y noticias de Loja, Ecuador. Tu guía completa de entretenimiento y diversión local.',
  openGraph: {
    title: 'Vive Loja - Descubre Eventos, Locales y Noticias de tu Ciudad',
    description: 'Explora los mejores eventos, restaurantes, bares, locales y noticias de Loja, Ecuador.',
    url: 'https://viveloja.com',
    siteName: 'Vive Loja',
    images: [
      {
        url: 'https://viveloja.com/viveloja.png',
        width: 1200,
        height: 630,
        alt: 'Vive Loja',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vive Loja - Descubre Eventos, Locales y Noticias',
    description: 'Explora los mejores eventos, restaurantes, bares y noticias de Loja, Ecuador.',
    images: ['https://viveloja.com/viveloja.png'],
  },
}

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  const pricingCatalog = await getPublishedCatalog()
  let personalizedData = null
  if (session?.user?.id) {
    personalizedData = await getPersonalizedHomeData(session.user.id)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20">
      <main className="space-y-16 sm:space-y-20">
        {/* Hero Map with Suspense - Loads in parallel, shows skeleton while loading */}
        <Suspense fallback={<HomeHeroMapSkeleton />}>
          <HomeHeroMapSection />
        </Suspense>

        <div className="section-shell space-y-20 sm:space-y-24">
          {personalizedData && session?.user && (
            <HomePersonalizedSection
              data={personalizedData}
              userName={session.user.name ?? ''}
            />
          )}

          {/* Composition configured in /admin/home and shared with the app; the
              fixed stack below is the fallback when nothing is configured. */}
          <HomeConfiguredSections
            fallback={
              <>
              <TodayInLoja />
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
              </>
            }
          />

          <section className="relative overflow-hidden border-y border-border/60 bg-card/60 py-14 sm:py-20">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
            <div className="section-shell space-y-10">
              <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                <div><p className="eyebrow text-primary">Tu local, a tu ritmo</p><h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Empieza visible.<br/>Crece cuando te haga falta.</h2></div>
                <p className="max-w-xl text-base leading-relaxed text-muted-foreground lg:justify-self-end">Compara sin registrarte. Elige primero y crea tu acceso únicamente al confirmar. Durante la beta, todos los planes se activan por $0 y muestran su precio comercial de referencia.</p>
              </div>
              <PricingCards catalog={pricingCatalog} />
            </div>
          </section>

          {/* CTA final */}
          <section className="rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-accent to-primary/5 px-6 py-10 sm:px-10 sm:py-14">
            <MotionDiv {...fadeInUp} viewport={viewportOnce} className="space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/70 px-3 py-1 text-xs font-semibold text-primary">
                <Compass className="h-3.5 w-3.5" />
                Para negocios y organizadores
              </span>
              <h3 className="max-w-2xl text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                ¿Tienes un local o evento? Haz que más personas lo encuentren.
              </h3>
              <p className="max-w-xl text-base text-muted-foreground">
                Publica gratis o elige un plan para sumar contenido, promociones, mensajes, reservas y más ubicaciones.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild className="h-12 rounded-xl px-7 text-base">
                  <Link href="/auth/signup?intent=business&plan=free&cycle=MONTHLY">Publicar gratis</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-12 rounded-xl px-7 text-base">
                  <Link href="/planes">
                    Ver planes y precios <Search className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </MotionDiv>
          </section>

          {/* CTA descarga app iOS */}
          <HomeAppCta />
        </div>
      </main>
    </div>
  )
}

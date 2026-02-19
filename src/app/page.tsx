import Link from 'next/link'
import { ArrowRight, Compass, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MotionDiv, fadeInUp, viewportOnce } from '@/components/ui/motion'
import { BlogCard } from '@/components/features/blog'
import { HomeHeroMap } from '@/components/features/home/home-hero-map'
import { HomeCategoriesGrid } from '@/components/features/home/home-categories-grid'
import { HomeFeaturedEvents } from '@/components/features/home/home-featured-events'
import { HomeLatestVenues } from '@/components/features/home/home-latest-venues'
import { HomeFeaturedVenues } from '@/components/features/home/home-featured-venues'
import { HomePromoGrid } from '@/components/features/home/home-promo-grid'
import { HomeRelatedEvents } from '@/components/features/home/home-related-events'
import { getEvents } from '@/lib/queries/events'
import { getPosts } from '@/lib/queries/posts'
import { getVenues } from '@/lib/queries/venues'

export default async function HomePage() {
  const HERO_MAP_LIMIT = 80

  let featuredPosts: Awaited<ReturnType<typeof getPosts>> = []
  try {
    featuredPosts = await getPosts({ status: 'APPROVED', featured: 'true' })
  } catch {
    featuredPosts = []
  }

  let venueList: Awaited<ReturnType<typeof getVenues>> = []
  let eventList: Awaited<ReturnType<typeof getEvents>> = []
  try {
    ;[venueList, eventList] = await Promise.all([
      getVenues({ status: 'APPROVED' }, HERO_MAP_LIMIT),
      getEvents({ status: 'APPROVED' }, HERO_MAP_LIMIT),
    ])
  } catch {
    venueList = []
    eventList = []
  }

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
  const categories = Array.from(categoryCountMap.values()).slice(0, 8)

  const mapboxToken =
    process.env.MAPBOX_ACCESS_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? ''
  const mapStyle =
    process.env.MAPBOX_STYLE ??
    process.env.NEXT_PUBLIC_MAPBOX_STYLE ??
    'mapbox://styles/mapbox/streets-v12'

  const heroVenues = venueList.map((venue) => ({
    id: venue.id,
    name: venue.name,
    slug: venue.slug,
    description: venue.description,
    image: venue.image,
    location: venue.location,
    address: venue.address,
    lat: venue.lat ?? null,
    lng: venue.lng ?? null,
    featured: venue.featured,
    phone: venue.phone,
    website: venue.website,
    category: venue.category,
  }))

  const heroEvents = eventList.map((event) => ({
    id: event.id,
    title: event.title,
    slug: event.slug,
    description: event.description,
    image: event.image,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate?.toISOString() ?? null,
    location: event.location,
    address: event.address,
    lat: event.lat ?? null,
    lng: event.lng ?? null,
    featured: event.featured,
    category: event.category,
  }))

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20 pb-10 pt-14">
      <main className="mt-8 space-y-14 sm:space-y-20">
        <HomeHeroMap
          venues={heroVenues}
          events={heroEvents}
          mapboxToken={mapboxToken}
          mapStyle={mapStyle}
        />

        <div className="section-shell space-y-16 sm:space-y-20">

          {/* Categories visual grid */}
          <HomeCategoriesGrid categories={categories} />

          {/* Featured events masonry */}
          <HomeFeaturedEvents events={heroEvents} />

          {/* Related events */}
          <HomeRelatedEvents events={heroEvents} />

          {/* Latest venues horizontal scroll */}
          <HomeLatestVenues venues={heroVenues} />

          {/* Featured venues grid */}
          <HomeFeaturedVenues venues={heroVenues} />

          {/* Promo / trending masonry grid */}
          <HomePromoGrid venues={heroVenues} events={heroEvents} />

          {/* Blog */}
          {featuredPosts.length > 0 && (
            <section className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">📖 Inspírate</p>
                  <h2 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">Guías para salir mejor</h2>
                </div>
                <Button asChild variant="outline" className="h-11 rounded-xl">
                  <Link href="/blog">
                    Ver blog <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {featuredPosts.slice(0, 3).map((post) => (
                  <MotionDiv key={post.id} {...fadeInUp} viewport={viewportOnce}>
                    <BlogCard post={post} />
                  </MotionDiv>
                ))}
              </div>
            </section>
          )}

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

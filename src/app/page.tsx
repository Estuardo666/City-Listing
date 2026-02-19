import Link from 'next/link'
import {
  ArrowRight,
  Calendar,
  Compass,
  MapPin,
  Newspaper,
  ShieldCheck,
  Ticket,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  MotionDiv,
  MotionCard,
  fadeIn,
  fadeInUp,
  scaleIn,
  staggerContainer,
  viewportOnce,
} from '@/components/ui/motion'
import { getPosts } from '@/lib/queries/posts'
import { BlogCard } from '@/components/features/blog'

export default async function HomePage() {
  // Fetch featured blog posts
  const featuredPosts = await getPosts({ status: 'APPROVED', featured: 'true' })
  const highlights = [
    {
      icon: Calendar,
      title: 'Eventos Curados',
      description: 'Agenda actualizada con conciertos, cultura y actividades familiares en Loja.',
      cta: 'Explorar eventos',
      href: '/eventos',
    },
    {
      icon: MapPin,
      title: 'Locales Verificados',
      description: 'Restaurantes, bares y cafes validados por la comunidad antes de publicarse.',
      cta: 'Descubrir locales',
      href: '/locales',
    },
    {
      icon: Newspaper,
      title: 'Blog de Loja',
      description: 'Artículos, guías e historias sobre la cultura, gastronomía y vida en Loja.',
      cta: 'Leer blog',
      href: '/blog',
    },
  ]

  const accentColors = [
    'bg-accent text-accent-foreground',
    'bg-coral-subtle text-coral-subtle-foreground',
    'bg-emerald-subtle text-emerald-subtle-foreground',
  ]

  return (
    <div className="min-h-screen pb-16 pt-14">
      <main className="section-shell mt-12 space-y-20 sm:space-y-24">

        {/* Hero */}
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <MotionDiv {...fadeInUp} viewport={viewportOnce} className="space-y-8">
            <div className="space-y-5">
              <span className="badge-coral">
                <MapPin className="h-3 w-3" /> Loja, Ecuador
              </span>
              <h1 className="max-w-2xl text-4xl font-semibold leading-[1.15] tracking-tight sm:text-5xl lg:text-[3.5rem]">
                Descubre lo mejor de tu ciudad, <span className="text-primary">en un solo lugar</span>.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Eventos, restaurantes y noticias curados por la comunidad. Publica tu negocio y llega a quienes realmente buscan qué hacer en Loja.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button size="lg" asChild className="press-scale h-12 rounded-xl px-6 text-base">
                <Link href="/explorar" className="inline-flex items-center gap-2">
                  Explorar ciudad
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="press-scale h-12 rounded-xl px-6 text-base">
                <Link href="/auth/signup">Publicar mi negocio</Link>
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:max-w-md">
              {[
                { label: 'Eventos semanales', value: '+40', color: 'bg-accent/60' },
                { label: 'Locales activos', value: '+120', color: 'bg-emerald-subtle' },
                { label: 'Artículos blog', value: `+${featuredPosts.length}`, color: 'bg-coral-subtle' },
              ].map((stat) => (
                <div key={stat.label} className={`rounded-2xl ${stat.color} p-4`}>
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>
          </MotionDiv>

          {/* Hero card preview */}
          <MotionDiv {...scaleIn} viewport={viewportOnce} className="space-y-3">
            {featuredPosts.length > 0 && (
              <div className="rounded-2xl border border-border/60 bg-card p-5">
                <div className="flex items-center justify-between">
                  <span className="badge-coral">
                    <Newspaper className="h-3 w-3" /> Destacado del blog
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {featuredPosts[0].category.icon ?? '📝'} {featuredPosts[0].category.name}
                  </span>
                </div>
                <p className="mt-3 text-base font-semibold text-foreground line-clamp-2">
                  {featuredPosts[0].title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {featuredPosts[0].excerpt}
                </p>
                <Link
                  href={`/blog/${featuredPosts[0].slug}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  Leer artículo <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border/60 bg-emerald-subtle p-4">
                <p className="text-xs font-medium text-emerald-subtle-foreground">Restaurantes nuevos</p>
                <p className="mt-1.5 text-sm text-emerald-subtle-foreground/80">5 listados aprobados esta semana</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-coral-subtle p-4">
                <p className="text-xs font-medium text-coral-subtle-foreground">Blog activo</p>
                <p className="mt-1.5 text-sm text-coral-subtle-foreground/80">{featuredPosts.length} artículos destacados</p>
              </div>
            </div>
          </MotionDiv>
        </section>

        {/* Features */}
        <section className="space-y-8">
          <MotionDiv {...fadeIn} viewport={viewportOnce} className="space-y-3">
            <p className="eyebrow">Experiencia city listing</p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Contenido útil, interfaz limpia, flujo seguro
            </h2>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
              Inspirada en la claridad de macOS y la calidez de Airbnb: rápida de navegar, confiable para usuarios y escalable para la ciudad.
            </p>
          </MotionDiv>

          <MotionDiv {...staggerContainer} viewport={viewportOnce} className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {highlights.map((item, i) => (
              <MotionCard
                key={item.title}
                {...fadeInUp}
                className="group flex flex-col rounded-2xl border border-border/60 bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20"
              >
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${accentColors[i]}`}>
                  <item.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                <Link
                  href={item.href}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  {item.cta} <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
                </Link>
              </MotionCard>
            ))}
          </MotionDiv>
        </section>

        {/* Featured Blog Posts */}
        {featuredPosts.length > 0 && (
          <section className="space-y-8">
            <MotionDiv {...fadeIn} viewport={viewportOnce} className="space-y-3">
              <p className="eyebrow">Blog destacado</p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Historias de Loja
              </h2>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
                Artículos, guías e historias sobre la cultura, gastronomía y vida en Loja.
              </p>
            </MotionDiv>

            <MotionDiv {...staggerContainer} viewport={viewportOnce} className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredPosts.slice(0, 3).map((post) => (
                <MotionDiv key={post.id} {...fadeInUp}>
                  <BlogCard post={post} />
                </MotionDiv>
              ))}
            </MotionDiv>

            <MotionDiv {...fadeIn} viewport={viewportOnce}>
              <Button asChild className="press-scale h-11 rounded-xl">
                <Link href="/blog">
                  Ver todos los artículos <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </MotionDiv>
          </section>
        )}

        {/* Trust + Roadmap */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <MotionCard {...fadeInUp} viewport={viewportOnce} className="rounded-2xl border border-border/60 bg-card p-6 lg:col-span-2">
            <p className="eyebrow">Confianza y control</p>
            <h3 className="mt-3 text-xl font-semibold text-foreground">Todo contenido pasa por aprobación antes de publicarse</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Evitamos spam y mantenemos la calidad del marketplace local con revisión editorial y reglas por categoría.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-secondary/60 p-4">
                <p className="text-sm font-medium text-foreground">Para usuarios</p>
                <p className="mt-1.5 text-sm text-muted-foreground">Publica eventos o negocios en minutos desde tu panel.</p>
              </div>
              <div className="rounded-xl bg-emerald-subtle p-4">
                <p className="text-sm font-medium text-emerald-subtle-foreground">Para la ciudad</p>
                <p className="mt-1.5 text-sm text-emerald-subtle-foreground/80">Un catálogo local confiable que sí se mantiene actualizado.</p>
              </div>
            </div>
          </MotionCard>

          <MotionCard {...fadeInUp} viewport={viewportOnce} className="rounded-2xl border border-border/60 bg-card p-6">
            <p className="eyebrow">Roadmap</p>
            <h3 className="mt-3 text-lg font-semibold text-foreground">Próxima fase</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3 rounded-xl bg-accent p-3.5">
                <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-sm text-accent-foreground">Venta de tickets integrada para eventos destacados.</p>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-coral-subtle p-3.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
                <p className="text-sm text-coral-subtle-foreground">Perfiles verificados y priorización premium.</p>
              </div>
            </div>
          </MotionCard>
        </section>

        {/* CTA */}
        <MotionDiv {...fadeInUp} viewport={viewportOnce} className="rounded-3xl border border-primary/15 bg-accent px-8 py-12 text-center sm:px-12">
          <span className="badge-coral mx-auto">
            <Compass className="h-3 w-3" /> Empieza hoy
          </span>
          <h3 className="mx-auto mt-4 max-w-xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Haz visible tu evento o negocio en Loja
          </h3>
          <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-muted-foreground">
            Crea tu cuenta y entra al flujo de aprobación. Aparece donde la gente realmente busca qué hacer.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild className="press-scale h-12 rounded-xl px-7 text-base">
              <Link href="/auth/signup">Crear cuenta gratis</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="press-scale h-12 rounded-xl px-7 text-base">
              <Link href="/dashboard">Ir al dashboard</Link>
            </Button>
          </div>
        </MotionDiv>
      </main>

      <footer className="section-shell mt-14">
        <div className="flex flex-col gap-4 rounded-2xl border border-border/50 bg-white/60 px-5 py-5 text-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-muted-foreground">© 2026 CityListing Loja. Diseñado para crecer con la ciudad.</p>
          <div className="flex items-center gap-5 text-muted-foreground">
            {[
              { href: '/about', label: 'Acerca de' },
              { href: '/contact', label: 'Contacto' },
              { href: '/privacy', label: 'Privacidad' },
            ].map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}

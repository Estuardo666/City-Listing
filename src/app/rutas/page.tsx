import { ArrowRight, Coffee } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'
import { RouteCard } from '@/components/route/route-card'

export const metadata = {
  title: 'Rutas turísticas - Vive Loja',
  description:
    'Explora Loja a través de rutas turísticas temáticas con paradas verificadas. Descubre senderos, puntos de interés y recorridos guiados por la ciudad y sus alrededores.',
  openGraph: {
    title: 'Rutas Turísticas en Loja | Vive Loja',
    description: 'Rutas temáticas con paradas verificadas para explorar Loja, Ecuador.',
    url: 'https://viveloja.com/rutas',
    siteName: 'Vive Loja',
    images: [{ url: 'https://viveloja.com/viveloja.png', width: 1200, height: 630, alt: 'Rutas turísticas en Loja - Vive Loja' }],
    locale: 'es_EC',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rutas Turísticas en Loja',
    description: 'Rutas temáticas con paradas verificadas para explorar Loja, Ecuador.',
    images: ['https://viveloja.com/viveloja.png'],
  },
  alternates: { canonical: 'https://viveloja.com/rutas' },
}

export const dynamic = 'force-dynamic'

export default async function RoutesPage() {
  const routes = await prisma.route.findMany({
    where: { status: 'APPROVED' },
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    include: {
      stops: { select: { id: true }, orderBy: { order: 'asc' } },
    },
  })

  return (
    <div className="pb-20 pt-10 sm:pt-14">
      <section className="section-shell space-y-8">
        {routes.some((route) => route.slug === 'ruta-del-cafe-loja') && (
          <Link
            href="/rutas/ruta-del-cafe-loja"
            className="group relative block overflow-hidden rounded-[2rem] border border-[#d7b58a]/40 bg-[#1d2a22] text-[#fff9ef] shadow-sm"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_15%,rgba(196,143,83,0.32),transparent_36%),linear-gradient(120deg,rgba(18,38,27,0.98),rgba(45,56,37,0.83))]" />
            <div className="relative grid gap-8 px-6 py-9 sm:px-10 sm:py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div className="max-w-2xl space-y-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#d7b58a]/40 bg-[#fff9ef]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#f4d8ad]">
                  <Coffee className="h-3.5 w-3.5" />
                  Ruta destacada
                </span>
                <h2 className="text-4xl font-medium leading-[0.95] tracking-tight text-[#fff9ef] sm:text-6xl">
                  Ruta del Café
                  <span className="block text-[#e9bd82]">de Loja</span>
                </h2>
                <p className="max-w-xl text-sm leading-relaxed text-[#f4e8d4]/80 sm:text-base">
                  Once cafeterías, una ciudad para caminar y el sabor del café lojano en cada parada.
                </p>
              </div>
              <div className="flex items-end justify-between gap-4 lg:justify-self-end">
                <span className="text-sm text-[#f4e8d4]/70">Cafeterías de especialidad · 1 día</span>
                <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#e9bd82] px-4 py-2.5 text-sm font-semibold text-[#1d2a22] transition-transform group-hover:translate-x-1">
                  Ver ruta <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </Link>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium sm:text-3xl">Rutas turísticas</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Explora Loja a través de nuestras rutas temáticas
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link href="/rutas/crear">Crear ruta</Link>
          </Button>
        </div>

        {routes.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {routes.map((route) => (
              <RouteCard key={route.id} route={route as Parameters<typeof RouteCard>[0]['route']} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg font-semibold text-muted-foreground">No hay rutas disponibles</p>
            <p className="mt-1 text-sm text-muted-foreground">Sé el primero en crear una ruta turística</p>
          </div>
        )}
      </section>
    </div>
  )
}

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'
import { RouteCard } from '@/components/route/route-card'

export const metadata = {
  title: 'Rutas turísticas - Vive Loja',
  description: 'Descubre las mejores rutas turísticas en Loja, Ecuador',
}

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Rutas turísticas</h1>
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

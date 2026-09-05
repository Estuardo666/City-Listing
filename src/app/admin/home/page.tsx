import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAllHomeSections } from '@/lib/queries/home-sections'
import { HomeSectionsManager } from '@/components/features/home/home-sections-manager'

export const metadata = {
  title: 'Inicio - Admin - Vive Loja',
}

/**
 * Editor of the home composition. Every carousel on the app and the website is
 * a row here, so this page is the one place that decides what people see first.
 */
export default async function AdminHomePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return <div className="p-8 text-center text-muted-foreground">No autorizado</div>
  }

  const [sections, categories, collections] = await Promise.all([
    getAllHomeSections(),
    prisma.category.findMany({ orderBy: { name: 'asc' }, select: { slug: true, name: true, type: true } }),
    prisma.collection.findMany({
      where: { isPublic: true },
      orderBy: { name: 'asc' },
      take: 100,
      select: { slug: true, name: true },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium">Inicio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cada fila es un carrusel de la pantalla de inicio. Puedes crear varias del mismo tipo con
          filtros distintos, reordenarlas y activarlas o desactivarlas sin publicar una nueva version
          de la app.
        </p>
      </div>

      <HomeSectionsManager
        sections={sections.map((section) => ({
          ...section,
          params: section.params as Record<string, unknown> | null,
          startsAt: section.startsAt?.toISOString() ?? null,
          endsAt: section.endsAt?.toISOString() ?? null,
        }))}
        categories={categories}
        collections={collections}
      />
    </div>
  )
}

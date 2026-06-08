import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GoogleTypesManager } from './google-types-manager'

export const metadata = {
  title: 'Google Types - Admin - Vive Loja',
}

export default async function AdminGoogleTypesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return <div className="p-8 text-center text-muted-foreground">No autorizado</div>
  }

  const mappings = await prisma.googlePlaceTypeMapping.findMany({
    orderBy: { googleType: 'asc' },
  })

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      subcategories: {
        orderBy: { name: 'asc' },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium">Google Place Type Mappings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestiona el mapeo entre tipos de Google Places y categorías internas.
        </p>
      </div>

      <div className="rounded-xl border border-border/50 bg-secondary/30 p-4 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">Automático:</strong> Cuando importas locales desde Google Places,
          el sistema usa estos mappings para asignar categorías automáticamente.
          Los mappings con confianza &lt; 100 requieren aprobación.
        </p>
      </div>

      <GoogleTypesManager
        initialMappings={mappings.map((m) => ({
          id: m.id,
          googleType: m.googleType,
          categorySlugs: m.categorySlugs,
          subcategorySlugs: m.subcategorySlugs,
          confidence: m.confidence,
          approved: m.approved,
        }))}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          type: c.type,
          icon: c.icon,
          subcategories: c.subcategories.map((s) => ({
            id: s.id,
            name: s.name,
            slug: s.slug,
          })),
        }))}
      />
    </div>
  )
}

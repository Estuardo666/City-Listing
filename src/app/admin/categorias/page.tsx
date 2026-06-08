import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CategoryEditForm } from './category-edit-form'

export const metadata = {
  title: 'Categorias - Admin - Vive Loja',
}

export default async function AdminCategoriesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return <div className="p-8 text-center text-muted-foreground">No autorizado</div>
  }

  const categories = await prisma.category.findMany({
    where: {
      type: 'VENUE',
      parentId: null,
    },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      seoTitle: true,
      seoDescription: true,
      introText: true,
      icon: true,
      color: true,
      _count: {
        select: {
          venues: { where: { status: 'APPROVED' } },
        },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium">Categorias de locales</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestiona las categorias de locales. Los campos SEO se generan automaticamente pero puedes personalizarlos.
        </p>
      </div>

      {/* Info */}
      <div className="rounded-xl border border-border/50 bg-secondary/30 p-4 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">Paginas automaticas:</strong> Cada categoria genera
          dos paginas publicas: una de categoria (/{'{slug}'}) y una de ranking (/mejores/{'{slug}'}).
          Los campos vacios usan valores generados automaticamente.
        </p>
      </div>

      {/* Lista de categorias */}
      <div className="space-y-4">
        {categories.map((category) => (
          <CategoryEditForm
            key={category.id}
            category={{
              id: category.id,
              name: category.name,
              slug: category.slug,
              description: category.description,
              seoTitle: category.seoTitle,
              seoDescription: category.seoDescription,
              introText: category.introText,
              icon: category.icon,
              color: category.color,
              venueCount: category._count.venues,
            }}
          />
        ))}
      </div>

      {categories.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-semibold text-muted-foreground">
            No hay categorias de locales
          </p>
        </div>
      )}
    </div>
  )
}

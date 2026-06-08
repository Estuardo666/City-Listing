import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { GooglePlacesImport } from '@/components/features/admin/google-import/google-places-import'
import { GoogleImportTabs } from '@/components/features/admin/google-import/google-import-tabs'

export const metadata: Metadata = {
  title: 'Importador Google Places - Administración',
  description: 'Importa negocios desde Google Places API',
}

export default async function GoogleImportPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  const categories = await prisma.category.findMany({
    where: { type: 'VENUE' },
    select: { id: true, name: true, slug: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-medium">Importador Google Places</h1>
        <p className="text-gray-600 mt-2">
          Busca e importa negocios desde Google Places API de forma masiva
        </p>
      </div>

      <GoogleImportTabs />

      <div className="mt-6">
        <GooglePlacesImport categories={categories} />
      </div>
    </div>
  )
}

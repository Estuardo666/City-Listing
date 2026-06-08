import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { OsmImportForm } from '@/components/features/admin/osm/osm-import-form'
import { OsmTabs } from '../osm-tabs'

export const metadata: Metadata = {
  title: 'Nueva Importación OSM - Administración',
  description: 'Importar lugares desde OpenStreetMap',
}

export default async function NuevaImportacionPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-medium">Nueva Importación</h1>
        <p className="text-muted-foreground mt-2">
          Busca e importa lugares desde OpenStreetMap usando Overpass API
        </p>
      </div>

      <OsmTabs>
        <OsmImportForm />
      </OsmTabs>
    </div>
  )
}

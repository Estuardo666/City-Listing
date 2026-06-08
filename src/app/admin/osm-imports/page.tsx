import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { OsmImportsDashboard } from '@/components/features/admin/osm/osm-imports-dashboard'
import { OsmTabs } from './osm-tabs'

export const metadata: Metadata = {
  title: 'Importaciones OSM - Administración',
  description: 'Gestiona las importaciones desde OpenStreetMap',
}

export default async function OsmImportsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-medium">Importaciones OSM</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona las importaciones de lugares desde OpenStreetMap
        </p>
      </div>

      <OsmTabs defaultTab="dashboard">
        <OsmImportsDashboard />
      </OsmTabs>
    </div>
  )
}

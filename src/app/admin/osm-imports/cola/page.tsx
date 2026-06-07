import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { OsmQueueTable } from '@/components/features/admin/osm/osm-queue-table'
import { OsmTabs } from '../osm-tabs'

export const metadata: Metadata = {
  title: 'Cola de Importación OSM - Administración',
  description: 'Cola de trabajos de importación OSM',
}

export default async function ColaPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Cola de Importación</h1>
        <p className="text-muted-foreground mt-2">
          Monitorea el progreso de los trabajos de importación
        </p>
      </div>

      <OsmTabs>
        <OsmQueueTable />
      </OsmTabs>
    </div>
  )
}

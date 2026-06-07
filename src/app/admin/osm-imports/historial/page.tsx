import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { OsmHistoryTable } from '@/components/features/admin/osm/osm-history-table'
import { OsmTabs } from '../osm-tabs'

export const metadata: Metadata = {
  title: 'Historial OSM - Administración',
  description: 'Historial de importaciones desde OpenStreetMap',
}

export default async function HistorialPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Historial de Importaciones</h1>
        <p className="text-muted-foreground mt-2">
          Consulta el historial completo de importaciones realizadas
        </p>
      </div>

      <OsmTabs>
        <OsmHistoryTable />
      </OsmTabs>
    </div>
  )
}

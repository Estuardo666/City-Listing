import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { OsmConfigForm } from '@/components/features/admin/osm/osm-config-form'
import { OsmTabs } from '../osm-tabs'

export const metadata: Metadata = {
  title: 'Configuración OSM - Administración',
  description: 'Configuración de la integración con OpenStreetMap',
}

export default async function ConfiguracionPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Configuración OSM</h1>
        <p className="text-muted-foreground mt-2">
          Configura los parámetros de conexión con Overpass API
        </p>
      </div>

      <OsmTabs>
        <OsmConfigForm />
      </OsmTabs>
    </div>
  )
}

import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { GoogleImportTabs } from '@/components/features/admin/google-import/google-import-tabs'
import { SyncDashboard } from '@/components/features/admin/google-import/sync-dashboard'

export const metadata: Metadata = {
  title: 'Sincronizar Horarios - Administración',
  description: 'Sincroniza horarios y website de negocios importados desde Google Places',
}

export default async function SyncPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-medium">Sincronizar Horarios</h1>
        <p className="text-gray-600 mt-2">
          Actualiza horarios, website y datos de negocios importados desde Google Places
        </p>
      </div>

      <GoogleImportTabs />

      <div className="mt-6">
        <SyncDashboard />
      </div>
    </div>
  )
}

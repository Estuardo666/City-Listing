import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { GoogleImportTabs } from '@/components/features/admin/google-import/google-import-tabs'
import { JobsList } from './jobs-list'

export const metadata: Metadata = {
  title: 'Historial de Importaciones - Administración',
  description: 'Historial de importaciones de Google Places',
}

export default async function JobsPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-medium">Historial de Importaciones</h1>
        <p className="text-gray-600 mt-2">
          Consulta el historial y estado de las importaciones de Google Places
        </p>
      </div>

      <GoogleImportTabs />

      <div className="mt-6">
        <JobsList />
      </div>
    </div>
  )
}

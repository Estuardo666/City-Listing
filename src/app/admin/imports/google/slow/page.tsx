import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { GoogleImportTabs } from '@/components/features/admin/google-import/google-import-tabs'
import { SlowImportWizard } from '@/components/features/admin/google-import/slow-import-wizard'

export const metadata: Metadata = {
  title: 'Importación Lenta - Administración',
  description: 'Importa negocios desde Google Places gradualmente',
}

export default async function SlowImportPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-medium">Importación Lenta</h1>
        <p className="text-gray-600 mt-2">
          Importa negocios gradualmente como borradores. Pausa, reanuda o cancela en cualquier momento.
        </p>
      </div>

      <GoogleImportTabs />

      <div className="mt-6">
        <SlowImportWizard />
      </div>
    </div>
  )
}

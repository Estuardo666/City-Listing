import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { GoogleImportTabs } from '@/components/features/admin/google-import/google-import-tabs'
import { DraftManager } from '@/components/features/admin/google-import/draft-manager'

export const metadata: Metadata = {
  title: 'Borradores - Administración',
  description: 'Gestiona los negocios importados como borradores',
}

export default async function DraftsPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-medium">Borradores</h1>
        <p className="text-gray-600 mt-2">
          Revisa y publica los negocios importados desde Google Places
        </p>
      </div>

      <GoogleImportTabs />

      <div className="mt-6">
        <DraftManager />
      </div>
    </div>
  )
}

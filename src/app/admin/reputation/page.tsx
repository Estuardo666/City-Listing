import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ReputationDashboard } from '@/components/features/admin/reputation-dashboard'

export const metadata: Metadata = {
  title: 'Reputación - Administración',
  description: 'Gestiona el sistema de reputación de negocios',
}

export default async function ReputationPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-medium">Reputación</h1>
        <p className="text-gray-600 mt-2">
          Sistema de puntuación de reputación para rankings y ordenamiento
        </p>
      </div>

      <ReputationDashboard />
    </div>
  )
}

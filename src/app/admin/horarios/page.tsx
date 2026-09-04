import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { MissingHoursPanel } from '@/components/features/admin/hours/missing-hours-panel'

export const metadata: Metadata = {
  title: 'Horarios faltantes - Administración',
  description: 'Locales que no pueden aparecer en el filtro "abierto ahora"',
}

export default async function MissingHoursPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-medium">Horarios faltantes</h1>
        <p className="mt-2 text-gray-600">
          Estos locales nunca aparecen en el filtro &laquo;Abierto ahora&raquo;: no tienen horarios
          cargados o los que tienen no son utilizables.
        </p>
      </div>

      <MissingHoursPanel />
    </div>
  )
}

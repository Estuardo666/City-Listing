import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { GoogleImportTabs } from '@/components/features/admin/google-import/google-import-tabs'
import { JobProgress } from '@/components/features/admin/google-import/job-progress'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Detalle de Importación - Administración',
  description: 'Detalle del job de importación de Google Places',
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  const { id } = await params

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/admin/imports/google/jobs">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al historial
          </Link>
        </Button>
        <h1 className="text-3xl font-medium">Detalle de Importación</h1>
        <p className="text-gray-600 mt-2">ID: {id}</p>
      </div>

      <GoogleImportTabs />

      <div className="mt-6">
        <JobProgress jobId={id} />
      </div>
    </div>
  )
}

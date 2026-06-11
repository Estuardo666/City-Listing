import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { AIConfigForm } from '@/components/features/ai/ai-config-form'
import { AIDashboard } from '@/components/features/ai/ai-dashboard'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Upload, History } from 'lucide-react'

export default async function AdminIAPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/signin')
  if (session.user.role !== 'ADMIN') redirect('/dashboard')

  return (
    <div className="pb-16 pt-8">
      <section className="section-shell space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Configuración IA</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Configura el proveedor de IA para procesamiento automático de flyers.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/ia/historial">
                <History className="h-4 w-4 mr-2" />
                Historial
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/admin/ia/procesar">
                <Upload className="h-4 w-4 mr-2" />
                Procesar Flyer
              </Link>
            </Button>
          </div>
        </div>

        <AIDashboard />
        <AIConfigForm />
      </section>
    </div>
  )
}

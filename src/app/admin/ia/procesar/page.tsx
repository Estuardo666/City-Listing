import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { AIProcessForm } from '@/components/features/ai/ai-process-form'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function AdminIAProcesarPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/signin')
  if (session.user.role !== 'ADMIN') redirect('/dashboard')

  return (
    <div className="pb-16 pt-8">
      <section className="section-shell space-y-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/ia">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Procesar Flyer</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Sube una imagen, PDF o pega texto para que la IA extraiga la información del evento.
            </p>
          </div>
        </div>

        <AIProcessForm />
      </section>
    </div>
  )
}

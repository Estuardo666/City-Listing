import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { getWatchEventsAction } from '@/actions/watch-events'
import { WatchEventsList } from '@/components/features/watch-events/watch-events-list'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Sparkles } from 'lucide-react'

export default async function AdminTransmisionesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/signin')
  if (session.user.role !== 'ADMIN') redirect('/dashboard')

  const res = await getWatchEventsAction()
  const events = res.success && res.data ? res.data : []

  return (
    <div className="pb-16 pt-8">
      <section className="section-shell space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Transmisiones</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Gestiona los eventos deportivos, conciertos y transmisiones en vivo.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/ia/procesar">
                <Sparkles className="h-4 w-4 mr-2" />
                Crear con IA
              </Link>
            </Button>
          </div>
        </div>

        <WatchEventsList events={events as any} />
      </section>
    </div>
  )
}

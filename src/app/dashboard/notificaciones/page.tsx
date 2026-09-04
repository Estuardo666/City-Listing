import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NotificationPreferencesForm } from '@/components/features/notifications/notification-preferences-form'
import { WebPushOptIn } from '@/components/features/notifications/web-push-opt-in'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function NotificationSettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/signin')
  const notices = await prisma.eventUpdateNotice.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: 'desc' }, take: 50 })
  return (
    <div className="min-h-full bg-background">
      <div className="container mx-auto space-y-6 px-6 py-10">
        <section className="space-y-4"><h1 className="text-2xl font-semibold">Cambios en tus eventos guardados</h1>
          {notices.length === 0 && <p>No hay cambios de fecha ni cancelaciones.</p>}
          {notices.map(notice => <Link className="block space-y-2 rounded-xl border p-4" key={notice.id} href={`/eventos/${notice.slug}`}>
            <h2 className="font-semibold">{notice.title}</h2><p>{notice.body}</p>
            <time className="text-xs text-muted-foreground">{notice.createdAt.toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}</time>
          </Link>)}
        </section>
        <Card>
          <CardHeader>
            <CardTitle>Notificaciones en este dispositivo</CardTitle>
          </CardHeader>
          <CardContent>
            <WebPushOptIn />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferencias</CardTitle>
          </CardHeader>
          <CardContent>
            <NotificationPreferencesForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

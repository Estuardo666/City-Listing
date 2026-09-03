import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NotificationPreferencesForm } from '@/components/features/notifications/notification-preferences-form'
import { WebPushOptIn } from '@/components/features/notifications/web-push-opt-in'

export default function NotificationSettingsPage() {
  return (
    <div className="min-h-full bg-background">
      <div className="container mx-auto space-y-6 px-6 py-10">
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

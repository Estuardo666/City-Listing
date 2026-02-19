import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NotificationPreferencesForm } from '@/components/features/notifications/notification-preferences-form'

export default function NotificationSettingsPage() {
  return (
    <div className="min-h-full bg-background">
      <div className="container mx-auto px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Notificaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <NotificationPreferencesForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

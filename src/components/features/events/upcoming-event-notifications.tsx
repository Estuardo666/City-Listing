import Link from 'next/link'
import { BellRing, CalendarClock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'
import type { UpcomingEventNotification } from '@/types/event'

type UpcomingEventNotificationsProps = {
  notifications: UpcomingEventNotification[]
  title?: string
  emptyLabel?: string
}

export function UpcomingEventNotifications({
  notifications,
  title = 'Próximos eventos',
  emptyLabel = 'No hay eventos próximos en las próximas horas.',
}: UpcomingEventNotificationsProps) {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle className="inline-flex items-center gap-2 text-lg">
          <BellRing className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <ul className="space-y-3">
            {notifications.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-border/70 bg-background/70 p-3"
              >
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {formatDateTime(item.startDate)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{item.address ?? item.location}</p>
                <p className="mt-1 text-xs text-muted-foreground">Categoría: {item.category.name}</p>
                <Button asChild className="mt-2 h-8 px-3 text-xs">
                  <Link href={`/eventos/${item.slug}`}>Ver evento</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

import Link from 'next/link'
import type { Metadata } from 'next'
import { getActiveWatchEvents } from '@/lib/queries/watch-events'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, Users } from 'lucide-react'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Partidos y Transmisiones en Loja | Vive Loja',
  description: 'Descubre dónde ver partidos, conciertos y eventos en vivo en Loja. Promociones, pantallas gigantes y reservas.',
  alternates: { canonical: 'https://viveloja.com/partidos' },
}

const TYPE_LABELS: Record<string, string> = {
  SPORTS: 'Deportes',
  CONCERT: 'Concierto',
  THEATER: 'Teatro',
  ESPORTS: 'eSports',
  OTHER: 'Evento',
}

export default async function PartidosPage() {
  const events = await getActiveWatchEvents(50)

  return (
    <div className="pb-20 pt-10 sm:pt-14">
      <section className="section-shell space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Partidos y Transmisiones</h1>
          <p className="text-muted-foreground">
            Encuentra dónde ver los mejores eventos en vivo en Loja.
          </p>
        </div>

        {events.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">No hay eventos programados en este momento.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const performers = event.performersList.map((p) => p.performer.name)
              const performersStr = performers.join(' vs ')
              const matchDate = new Date(event.matchDate)

              return (
                <Link key={event.id} href={`/partidos/${event.slug}`} className="group">
                  <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
                    {event.image && (
                      <img src={event.image} alt={event.name} className="w-full h-36 object-cover" />
                    )}
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {TYPE_LABELS[event.type] || event.type}
                        </Badge>
                        {event.competition && (
                          <span className="text-xs text-muted-foreground">{event.competition}</span>
                        )}
                      </div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {performersStr || event.name}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {matchDate.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}
                        </span>
                        {event.matchTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {event.matchTime}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event._count.venues} {event._count.venues === 1 ? 'lugar' : 'lugares'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

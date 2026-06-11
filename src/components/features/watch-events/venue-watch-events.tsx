import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Tv, Monitor, Gift } from 'lucide-react'

interface VenueWatchEvent {
  id: string
  promotion: string | null
  hasBigScreen: boolean
  hasFreeEntry: boolean
  watchEvent: {
    id: string
    name: string
    slug: string
    type: string
    matchDate: Date
    matchTime: string | null
    competition: string | null
    performersList: Array<{ performer: { name: string } }>
  }
}

const TYPE_LABELS: Record<string, string> = {
  SPORTS: 'Deportes',
  CONCERT: 'Concierto',
  THEATER: 'Teatro',
  ESPORTS: 'eSports',
  OTHER: 'Evento',
}

export function VenueWatchEvents({ events }: { events: VenueWatchEvent[] }) {
  if (events.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Tv className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Próximas Transmisiones</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.map((ev) => {
          const performers = ev.watchEvent.performersList.map((p) => p.performer.name)
          const performersStr = performers.join(' vs ')
          const matchDate = new Date(ev.watchEvent.matchDate)

          return (
            <div key={ev.id} className="flex items-center gap-4 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link href={`/partidos/${ev.watchEvent.slug}`} className="font-medium text-sm hover:text-primary transition-colors truncate">
                    {performersStr || ev.watchEvent.name}
                  </Link>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {TYPE_LABELS[ev.watchEvent.type] || ev.watchEvent.type}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {matchDate.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}
                  </span>
                  {ev.watchEvent.matchTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {ev.watchEvent.matchTime}
                    </span>
                  )}
                  {ev.watchEvent.competition && (
                    <span>{ev.watchEvent.competition}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  {ev.hasBigScreen && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      <Monitor className="h-2.5 w-2.5 mr-0.5" /> Pantalla gigante
                    </Badge>
                  )}
                  {ev.hasFreeEntry && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      <Gift className="h-2.5 w-2.5 mr-0.5" /> Gratis
                    </Badge>
                  )}
                </div>
                {ev.promotion && (
                  <p className="text-xs text-primary font-medium mt-1">🎁 {ev.promotion}</p>
                )}
              </div>
              <Button asChild size="sm" variant="ghost" className="shrink-0">
                <Link href={`/partidos/${ev.watchEvent.slug}`}>Ver</Link>
              </Button>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

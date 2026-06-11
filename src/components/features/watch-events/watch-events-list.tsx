'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, Trash2, Edit, Eye, Star, MapPin, Calendar } from 'lucide-react'
import { deleteWatchEventAction } from '@/actions/watch-events'

interface WatchEventItem {
  id: string
  name: string
  slug: string
  type: string
  matchDate: Date
  matchTime: string | null
  competition: string | null
  status: string
  featured: boolean
  venuesCount: number
  createdAt: Date
}

const TYPE_BADGES: Record<string, { label: string; className: string }> = {
  SPORTS: { label: 'Deportes', className: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' },
  CONCERT: { label: 'Concierto', className: 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400' },
  THEATER: { label: 'Teatro', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' },
  ESPORTS: { label: 'eSports', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' },
  OTHER: { label: 'Otro', className: 'bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400' },
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Activo', className: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' },
  CANCELLED: { label: 'Cancelado', className: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' },
  FINISHED: { label: 'Finalizado', className: 'bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400' },
}

export function WatchEventsList({ events }: { events: WatchEventItem[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [deleting, startDelete] = useTransition()

  const filtered = events.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.competition || '').toLowerCase().includes(search.toLowerCase())
  )

  function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"?`)) return
    startDelete(async () => {
      const res = await deleteWatchEventAction(id)
      if (res.success) {
        toast.success('Evento eliminado')
        router.refresh()
      } else {
        toast.error(res.error || 'Error eliminando')
      }
    })
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Buscar transmisión..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">
              {search ? 'No se encontraron eventos.' : 'No hay transmisiones aún.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((event) => {
            const typeBadge = TYPE_BADGES[event.type] || TYPE_BADGES.OTHER
            const statusBadge = STATUS_BADGES[event.status] || STATUS_BADGES.ACTIVE
            const date = new Date(event.matchDate)

            return (
              <Card key={event.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{event.name}</h3>
                        {event.featured && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-xs ${typeBadge.className}`}>{typeBadge.label}</Badge>
                        <Badge className={`text-xs ${statusBadge.className}`}>{statusBadge.label}</Badge>
                        {event.competition && (
                          <span className="text-xs text-muted-foreground">{event.competition}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {date.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {event.matchTime ? ` ${event.matchTime}` : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.venuesCount} {event.venuesCount === 1 ? 'negocio' : 'negocios'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/partidos/${event.slug}`} target="_blank">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/admin/transmisiones/${event.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(event.id, event.name)}
                        disabled={deleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

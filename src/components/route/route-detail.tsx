'use client'

import Link from 'next/link'
import { MapPin, Clock, Mountain, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import type { RouteWithStops } from '@/types/route'

interface RouteDetailProps {
  route: RouteWithStops
}

const TYPE_LABELS: Record<string, string> = {
  gastronomic: 'Gastronómica',
  cultural: 'Cultural',
  adventure: 'Aventura',
  nightlife: 'Vida nocturna',
  nature: 'Naturaleza',
}

export function RouteDetail({ route }: RouteDetailProps) {
  const sortedStops = [...route.stops].sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge>{TYPE_LABELS[route.type] ?? route.type}</Badge>
          {route.difficulty && (
            <Badge variant="outline">{route.difficulty}</Badge>
          )}
        </div>
        <h1 className="text-2xl font-bold">{route.title}</h1>
        <p className="text-muted-foreground mt-2">{route.description}</p>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <User className="h-4 w-4" />
          {route.user.name ?? 'Anónimo'}
        </span>
        {route.duration && (
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {route.duration}
          </span>
        )}
        <span className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          {sortedStops.length} paradas
        </span>
        <span className="flex items-center gap-1">
          <Mountain className="h-4 w-4" />
          {route._count.favorites} favoritos
        </span>
      </div>

      {/* Content */}
      {route.content && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p>{route.content}</p>
        </div>
      )}

      {/* Stops */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Paradas de la ruta</h2>
        <div className="space-y-4">
          {sortedStops.map((stop, index) => (
            <div key={stop.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                {index < sortedStops.length - 1 && (
                  <div className="w-0.5 flex-1 bg-muted mt-1" />
                )}
              </div>
              <div className="flex-1 pb-4">
                {stop.venue ? (
                  <Link
                    href={`/locales/${stop.venue.slug}`}
                    className="block p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {stop.venue.image && (
                        <img
                          src={stop.venue.image}
                          alt={stop.venue.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium text-sm">{stop.venue.name}</p>
                        <p className="text-xs text-muted-foreground">{stop.venue.location}</p>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="p-3 rounded-lg border">
                    <p className="font-medium text-sm">{stop.title}</p>
                  </div>
                )}
                {stop.notes && (
                  <p className="text-xs text-muted-foreground mt-1 ml-3">{stop.notes}</p>
                )}
                {stop.duration && (
                  <p className="text-xs text-muted-foreground mt-0.5 ml-3 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {stop.duration}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

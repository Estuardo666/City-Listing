'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, Mountain } from 'lucide-react'

interface RouteCardProps {
  route: {
    id: string
    title: string
    slug: string
    description: string
    image: string | null
    duration: string | null
    difficulty: string | null
    type: string
    featured: boolean
    stops?: { id: string }[]
  }
}

const TYPE_LABELS: Record<string, string> = {
  gastronomic: 'Gastronómica',
  cultural: 'Cultural',
  adventure: 'Aventura',
  nightlife: 'Vida nocturna',
  nature: 'Naturaleza',
}

const TYPE_COLORS: Record<string, string> = {
  gastronomic: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  cultural: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  adventure: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  nightlife: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
  nature: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
}

export function RouteCard({ route }: RouteCardProps) {
  return (
    <Link href={`/rutas/${route.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md">
        {route.image && (
          <div className="aspect-[16/9] overflow-hidden">
            <img
              src={route.image}
              alt={route.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={`text-[10px] ${TYPE_COLORS[route.type] ?? ''}`}>
              {TYPE_LABELS[route.type] ?? route.type}
            </Badge>
            {route.featured && (
              <Badge variant="secondary" className="text-[10px]">Destacada</Badge>
            )}
          </div>
          <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
            {route.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {route.description}
          </p>
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            {route.stops && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {route.stops.length} paradas
              </span>
            )}
            {route.duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {route.duration}
              </span>
            )}
            {route.difficulty && (
              <span className="flex items-center gap-1">
                <Mountain className="h-3 w-3" />
                {route.difficulty}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

'use client'

import { useState, useEffect } from 'react'
import {
  Download,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Copy,
  Calendar,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'

interface Stats {
  totalImports: number
  totalVenues: number
  lastImport: string | null
  lastImportLocation: string | null
  pendingReview: number
  activeVenues: number
  disabledVenues: number
  importsToday: number
  importsThisWeek: number
  newPlacesDetected: number
  duplicatesFound: number
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  variant = 'default',
}: {
  title: string
  value: string | number
  icon: React.ElementType
  description?: string
  variant?: 'default' | 'coral' | 'emerald' | 'primary'
}) {
  const colorMap = {
    default: 'text-muted-foreground',
    coral: 'text-[hsl(var(--emphasis-1))]',
    emerald: 'text-[hsl(var(--emphasis-2))]',
    primary: 'text-primary',
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${colorMap[variant]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-medium">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  )
}

export function OsmImportsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/osm-import/stats')
        if (res.ok) {
          setStats(await res.json())
        }
      } catch (e) {
        console.error('Error loading stats:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Importaciones" value={stats.totalImports} icon={Download} variant="primary" />
        <StatCard title="Negocios Importados" value={stats.totalVenues} icon={MapPin} variant="emerald" />
        <StatCard
          title="Última Importación"
          value={stats.lastImport ? formatDate(stats.lastImport) : 'Ninguna'}
          icon={Clock}
          description={stats.lastImportLocation ?? undefined}
        />
        <StatCard title="Pendientes de Revisión" value={stats.pendingReview} icon={Calendar} variant="coral" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Negocios Activos" value={stats.activeVenues} icon={CheckCircle} variant="emerald" />
        <StatCard title="Negocios Deshabilitados" value={stats.disabledVenues} icon={XCircle} />
        <StatCard title="Importaciones Hoy" value={stats.importsToday} icon={TrendingUp} variant="primary" />
        <StatCard title="Importaciones esta Semana" value={stats.importsThisWeek} icon={TrendingUp} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nuevos Detectados</CardTitle>
            <MapPin className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">{stats.newPlacesDetected}</div>
            <p className="text-xs text-muted-foreground mt-1">Lugares encontrados en total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Duplicados Encontrados</CardTitle>
            <Copy className="h-4 w-4 text-[hsl(var(--emphasis-1))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">{stats.duplicatesFound}</div>
            <p className="text-xs text-muted-foreground mt-1">Coincidencias detectadas</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

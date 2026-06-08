'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw,
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { JobProgress } from './job-progress'

interface QualityMetrics {
  totalGoogle: number
  withoutWebsite: number
  withoutHours: number
  neverSynced: number
  syncedToday: number
  staleSync: number
}

export function SyncDashboard() {
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/imports/google/quality')
      if (!res.ok) return
      const data = await res.json()
      setMetrics(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/admin/imports/google/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxRecords: 100, batchSize: 20 }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al iniciar sincronización')
      }

      const data = await res.json()
      toast.success('Sincronización iniciada')
      setActiveJobId(data.jobId)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al sincronizar')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Data Quality Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard
            icon={Globe}
            label="Total Google"
            value={metrics.totalGoogle}
            color="text-blue-600"
            bg="bg-blue-50"
          />
          <MetricCard
            icon={Globe}
            label="Sin website"
            value={metrics.withoutWebsite}
            color="text-red-600"
            bg="bg-red-50"
          />
          <MetricCard
            icon={Clock}
            label="Sin horarios"
            value={metrics.withoutHours}
            color="text-orange-600"
            bg="bg-orange-50"
          />
          <MetricCard
            icon={AlertTriangle}
            label="Nunca sincronizados"
            value={metrics.neverSynced}
            color="text-yellow-600"
            bg="bg-yellow-50"
          />
          <MetricCard
            icon={CheckCircle}
            label="Sincronizados hoy"
            value={metrics.syncedToday}
            color="text-green-600"
            bg="bg-green-50"
          />
          <MetricCard
            icon={RefreshCw}
            label="Datos vencidos (>7d)"
            value={metrics.staleSync}
            color="text-purple-600"
            bg="bg-purple-50"
          />
        </div>
      )}

      {/* Sync Action */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sincronización manual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Actualiza horarios, website, teléfono y dirección de los 100 negocios más antiguos
            importados desde Google Places. Los datos se ordenan por fecha de última sincronización
            (los nunca sincronizados primero).
          </p>

          <div className="flex items-center gap-3">
            <Button onClick={handleSync} disabled={syncing || activeJobId !== null}>
              {syncing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Iniciando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sincronizar ahora
                </>
              )}
            </Button>

            {metrics && (
              <Badge variant="outline">
                {metrics.neverSynced + metrics.staleSync} pendientes
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Job Progress */}
      {activeJobId && (
        <JobProgress
          jobId={activeJobId}
          onDone={() => {
            toast.success('Sincronización completada')
            setActiveJobId(null)
            fetchMetrics()
          }}
        />
      )}
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ElementType
  label: string
  value: number
  color: string
  bg: string
}) {
  return (
    <Card>
      <CardContent className={`p-4 ${bg}`}>
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`h-4 w-4 ${color}`} />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  )
}

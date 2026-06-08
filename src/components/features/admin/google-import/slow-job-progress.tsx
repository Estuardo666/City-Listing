'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  Ban,
  Pause,
  Play,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface SlowJobStatus {
  id: string
  status: string
  totalRecords: number
  processedRecords: number
  importedRecords: number
  duplicateRecords: number
  errorRecords: number
  currentBatchIndex: number
  delayMs: number
  startedAt: string | null
  finishedAt: string | null
  pausedAt: string | null
  progress: number
  elapsedTime: number
  estimatedTimeRemaining: number
  logs: Array<{ id: string; level: string; message: string; createdAt: string }>
}

interface SlowJobProgressProps {
  jobId: string
  onDone?: () => void
}

function formatTime(ms: number): string {
  if (ms <= 0) return '0s'
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: React.ElementType; variant: string; label: string }> = {
    PENDING: { icon: Clock, variant: 'secondary', label: 'Pendiente' },
    RUNNING: { icon: Loader2, variant: 'default', label: 'Ejecutando' },
    PAUSED: { icon: Pause, variant: 'secondary', label: 'Pausado' },
    COMPLETED: { icon: CheckCircle, variant: 'default', label: 'Completado' },
    FAILED: { icon: XCircle, variant: 'destructive', label: 'Fallido' },
    CANCELLED: { icon: Ban, variant: 'secondary', label: 'Cancelado' },
  }
  const c = config[status] || config.PENDING
  const Icon = c.icon

  return (
    <Badge variant={c.variant as any} className="gap-1">
      <Icon className={`h-3 w-3 ${status === 'RUNNING' ? 'animate-spin' : ''}`} />
      {c.label}
    </Badge>
  )
}

export function SlowJobProgress({ jobId, onDone }: SlowJobProgressProps) {
  const [job, setJob] = useState<SlowJobStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/imports/google/slow/jobs/${jobId}`)
      if (!res.ok) throw new Error('Error al obtener estado')
      const data = await res.json()
      setJob(data)

      if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(data.status)) {
        onDone?.()
        return true
      }
      return false
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      return true
    } finally {
      setLoading(false)
    }
  }, [jobId, onDone])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    let cancelled = false

    const poll = async () => {
      const done = await fetchStatus()
      if (done || cancelled) {
        if (interval) clearInterval(interval)
        return
      }
    }

    poll()
    interval = setInterval(poll, 5000)

    return () => {
      cancelled = true
      if (interval) clearInterval(interval)
    }
  }, [fetchStatus])

  const handleAction = async (action: string) => {
    try {
      await fetch(`/api/admin/imports/google/slow/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      await fetchStatus()
    } catch {
      setError(`Error al ${action}`)
    }
  }

  if (loading && !job) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8 text-red-500">
          <AlertTriangle className="h-5 w-5 mr-2" />
          {error}
        </CardContent>
      </Card>
    )
  }

  if (!job) return null

  const isActive = job.status === 'RUNNING'
  const isPaused = job.status === 'PAUSED'
  const isPausable = isActive
  const isResumable = isPaused
  const isCancellable = isActive || isPaused || job.status === 'PENDING'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Importación lenta</CardTitle>
          <StatusBadge status={job.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progreso</span>
            <span>{Math.round(job.progress)}%</span>
          </div>
          <Progress value={job.progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {job.processedRecords} de {job.totalRecords} procesados
            {job.delayMs > 0 && ` · ${Math.round(job.delayMs / 1000)}s entre cada venue`}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xl font-bold text-blue-600">{job.totalRecords}</p>
            <p className="text-xs text-blue-600">Total</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-xl font-bold text-green-600">{job.importedRecords}</p>
            <p className="text-xs text-green-600">Importados</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <p className="text-xl font-bold text-yellow-600">{job.duplicateRecords}</p>
            <p className="text-xs text-yellow-600">Duplicados</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-xl font-bold text-red-600">{job.errorRecords}</p>
            <p className="text-xs text-red-600">Errores</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-xl font-bold">{formatTime(job.elapsedTime)}</p>
            <p className="text-xs text-muted-foreground">Tiempo</p>
          </div>
        </div>

        {isActive && (
          <p className="text-sm text-muted-foreground">
            Tiempo estimado restante: {formatTime(job.estimatedTimeRemaining)}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {isPausable && (
            <Button variant="outline" onClick={() => handleAction('pause')}>
              <Pause className="h-4 w-4 mr-2" />
              Pausar
            </Button>
          )}
          {isResumable && (
            <Button variant="default" onClick={() => handleAction('resume')}>
              <Play className="h-4 w-4 mr-2" />
              Reanudar
            </Button>
          )}
          {isCancellable && (
            <Button variant="destructive" onClick={() => handleAction('cancel')}>
              <Ban className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          )}
        </div>

        {job.logs && job.logs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Registro de actividad</h4>
            <div className="border rounded-lg max-h-[250px] overflow-y-auto">
              {job.logs.map((log) => (
                <div
                  key={log.id}
                  className={`px-3 py-1.5 text-xs border-b last:border-0 ${
                    log.level === 'ERROR'
                      ? 'bg-red-50 text-red-700'
                      : log.level === 'WARNING'
                        ? 'bg-yellow-50 text-yellow-700'
                        : ''
                  }`}
                >
                  <span className="text-muted-foreground mr-2">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                  {log.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

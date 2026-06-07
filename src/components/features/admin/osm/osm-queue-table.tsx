'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Pause, Play, XCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface SyncJob {
  id: string
  type: string
  status: string
  progress: number
  total: number
  processed: number
  startedAt: string | null
  finishedAt: string | null
  errorMessage: string | null
  createdAt: string
  import: { id: string; city: string; country: string } | null
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  RUNNING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  COMPLETED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  PAUSED: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
}

export function OsmQueueTable() {
  const [jobs, setJobs] = useState<SyncJob[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/osm-import/sync')
      if (res.ok) {
        const data = await res.json()
        setJobs(data.data)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [load])

  const handleAction = async (jobId: string, action: string) => {
    try {
      const res = await fetch('/api/admin/osm-import/sync', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, action }),
      })
      if (res.ok) {
        toast.success(`Job ${action === 'pause' ? 'pausado' : action === 'resume' ? 'reanudado' : 'cancelado'}`)
        load()
      }
    } catch {
      toast.error('Error al actualizar job')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cola de Importación</CardTitle>
            <CardDescription>{jobs.length} jobs en la cola</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : jobs.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No hay jobs en la cola</p>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.id} className="rounded-xl border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge className={`text-xs ${STATUS_COLORS[job.status] ?? ''}`}>{job.status}</Badge>
                    <span className="text-sm font-medium">{job.type}</span>
                    {job.import && (
                      <span className="text-xs text-muted-foreground">
                        {job.import.city}, {job.import.country}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {job.status === 'RUNNING' && (
                      <Button variant="ghost" size="icon" onClick={() => handleAction(job.id, 'pause')} title="Pausar">
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    {job.status === 'PAUSED' && (
                      <Button variant="ghost" size="icon" onClick={() => handleAction(job.id, 'resume')} title="Reanudar">
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    {(job.status === 'RUNNING' || job.status === 'PENDING' || job.status === 'PAUSED') && (
                      <Button variant="ghost" size="icon" onClick={() => handleAction(job.id, 'cancel')} title="Cancelar">
                        <XCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>

                {job.total > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{job.processed} / {job.total} procesados</span>
                      <span>{job.progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {job.errorMessage && (
                  <p className="mt-2 text-xs text-destructive">{job.errorMessage}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

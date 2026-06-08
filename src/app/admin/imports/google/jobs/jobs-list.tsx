'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Ban,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Job {
  id: string
  status: string
  country: string
  province: string
  city: string
  categories: string
  radius: number
  totalRecords: number
  processedRecords: number
  importedRecords: number
  duplicateRecords: number
  errorRecords: number
  startedAt: string | null
  finishedAt: string | null
  createdAt: string
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: React.ElementType; variant: string; label: string }> = {
    PENDING: { icon: Clock, variant: 'secondary', label: 'Pendiente' },
    RUNNING: { icon: Loader2, variant: 'default', label: 'Ejecutando' },
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

export function JobsList() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    let cancelled = false

    const fetchJobs = async () => {
      try {
        const res = await fetch(`/api/admin/imports/google/jobs?page=${page}&limit=20`)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) {
          setJobs(data.jobs)
          setTotalPages(data.totalPages)
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchJobs()
    interval = setInterval(fetchJobs, 10000)

    return () => {
      cancelled = true
      if (interval) clearInterval(interval)
    }
  }, [page])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8 text-muted-foreground">
          No hay importaciones registradas
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importaciones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Fecha</th>
                  <th className="px-3 py-2 text-left font-medium">Ubicación</th>
                  <th className="px-3 py-2 text-left font-medium">Radio</th>
                  <th className="px-3 py-2 text-left font-medium">Estado</th>
                  <th className="px-3 py-2 text-left font-medium">Total</th>
                  <th className="px-3 py-2 text-left font-medium">Importados</th>
                  <th className="px-3 py-2 text-left font-medium">Duplicados</th>
                  <th className="px-3 py-2 text-left font-medium">Errores</th>
                  <th className="px-3 py-2 text-left font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-t hover:bg-muted/20">
                    <td className="px-3 py-2 text-muted-foreground">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">
                      {job.city}, {job.province}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {job.radius >= 1000 ? `${job.radius / 1000}km` : `${job.radius}m`}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-3 py-2">{job.totalRecords}</td>
                    <td className="px-3 py-2 text-green-600">{job.importedRecords}</td>
                    <td className="px-3 py-2 text-yellow-600">{job.duplicateRecords}</td>
                    <td className="px-3 py-2 text-red-600">{job.errorRecords}</td>
                    <td className="px-3 py-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/imports/google/jobs/${job.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

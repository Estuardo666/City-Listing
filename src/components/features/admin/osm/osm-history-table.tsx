'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Trash2, RefreshCw, Eye, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatDate, formatDateTime } from '@/lib/utils'

interface OsmImportRecord {
  id: string
  city: string
  country: string
  categories: string
  radius: number
  status: string
  foundCount: number
  importedCount: number
  duplicateCount: number
  errorCount: number
  errorMessage: string | null
  createdAt: string
  user: { id: string; name: string | null; email: string }
  _count: { logs: number }
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  RUNNING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  COMPLETED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export function OsmHistoryTable() {
  const [imports, setImports] = useState<OsmImportRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [logs, setLogs] = useState<any[]>([])
  const limit = 15

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/osm-import/history?page=${page}&limit=${limit}`)
      if (res.ok) {
        const data = await res.json()
        setImports(data.data)
        setTotal(data.total)
      }
    } catch {
      toast.error('Error al cargar historial')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este registro?')) return
    try {
      const res = await fetch(`/api/admin/osm-import/history?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Registro eliminado')
        load()
      }
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const handleViewDetail = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    setExpandedId(id)
    try {
      const res = await fetch(`/api/admin/osm-import/history?id=${id}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs ?? [])
      }
    } catch {
      // silent
    }
  }

  const totalPages = Math.ceil(total / limit)

  const parseCategories = (json: string): string[] => {
    try { return JSON.parse(json) } catch { return [] }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Historial de Importaciones</CardTitle>
            <CardDescription>{total} importaciones realizadas</CardDescription>
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
        ) : imports.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No hay importaciones registradas</p>
        ) : (
          <div className="space-y-3">
            {imports.map((imp) => (
              <div key={imp.id} className="rounded-xl border">
                <div className="flex items-center gap-4 p-4">
                  <div className="flex-1 min-w-0 grid grid-cols-6 gap-4 items-center">
                    <div className="col-span-1">
                      <p className="text-sm font-medium">{formatDate(imp.createdAt)}</p>
                      <p className="text-xs text-muted-foreground" suppressHydrationWarning>{formatDateTime(imp.createdAt).split(', ')[1]}</p>
                    </div>
                    <div className="col-span-1">
                      <p className="text-sm font-medium">{imp.city}</p>
                      <p className="text-xs text-muted-foreground">{imp.country}</p>
                    </div>
                    <div className="col-span-1 flex flex-wrap gap-1">
                      {parseCategories(imp.categories).slice(0, 2).map((c) => (
                        <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
                      ))}
                      {parseCategories(imp.categories).length > 2 && (
                        <Badge variant="outline" className="text-[10px]">+{parseCategories(imp.categories).length - 2}</Badge>
                      )}
                    </div>
                    <div className="col-span-1 text-center">
                      <p className="text-sm font-semibold">{imp.foundCount}</p>
                      <p className="text-xs text-muted-foreground">encontrados</p>
                    </div>
                    <div className="col-span-1 text-center">
                      <p className="text-sm font-semibold text-emerald-600">{imp.importedCount}</p>
                      <p className="text-xs text-muted-foreground">importados</p>
                    </div>
                    <div className="col-span-1 flex items-center gap-2">
                      <Badge className={`text-xs ${STATUS_COLORS[imp.status] ?? ''}`}>{imp.status}</Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => handleViewDetail(imp.id)} title="Ver detalle">
                      {expandedId === imp.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(imp.id)} title="Eliminar">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {expandedId === imp.id && (
                  <div className="border-t px-4 py-3 bg-muted/30">
                    <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                      <div>Duplicados: <span className="font-semibold">{imp.duplicateCount}</span></div>
                      <div>Errores: <span className="font-semibold text-destructive">{imp.errorCount}</span></div>
                      <div>Radio: <span className="font-semibold">{(imp.radius / 1000).toFixed(1)} km</span></div>
                    </div>
                    {imp.errorMessage && (
                      <p className="text-sm text-destructive mb-2">{imp.errorMessage}</p>
                    )}
                    {logs.length > 0 && (
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {logs.map((log: any) => (
                          <p key={log.id} className={`text-xs ${log.level === 'ERROR' ? 'text-destructive' : 'text-muted-foreground'}`}>
                            [{log.level}] {log.message}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <>
            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Página {page} de {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  Siguiente
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

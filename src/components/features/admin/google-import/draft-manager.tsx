'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, XCircle, Loader2, FileText, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { bulkUpdateVenuesAction } from '@/actions/venues/bulk-update-venue-status'

interface DraftVenue {
  id: string
  name: string
  slug: string
  address: string | null
  phone: string | null
  website: string | null
  venueCategories: Array<{ category: { name: string } }>
  createdAt: string
}

export function DraftManager() {
  const [drafts, setDrafts] = useState<DraftVenue[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [publishing, setPublishing] = useState(false)

  const fetchDrafts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/imports/google/drafts?page=${page}&limit=20`)
      if (!res.ok) return
      const data = await res.json()
      setDrafts(data.drafts)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchDrafts()
  }, [fetchDrafts])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === drafts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(drafts.map((d) => d.id)))
    }
  }

  const handlePublish = async () => {
    if (selectedIds.size === 0) return
    setPublishing(true)

    const result = await bulkUpdateVenuesAction(Array.from(selectedIds), 'APPROVED')

    if (result.success) {
      toast.success(`${result.data?.count || 0} locales publicados`)
      setSelectedIds(new Set())
      fetchDrafts()
    } else {
      toast.error(result.error || 'Error al publicar')
    }

    setPublishing(false)
  }

  const handleReject = async () => {
    if (selectedIds.size === 0) return
    setPublishing(true)

    const result = await bulkUpdateVenuesAction(Array.from(selectedIds), 'REJECTED')

    if (result.success) {
      toast.success(`${result.data?.count || 0} locales rechazados`)
      setSelectedIds(new Set())
      fetchDrafts()
    } else {
      toast.error(result.error || 'Error al rechazar')
    }

    setPublishing(false)
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Borradores ({total})
          </CardTitle>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="default">{selectedIds.size} seleccionados</Badge>
              <Button size="sm" onClick={handlePublish} disabled={publishing}>
                {publishing ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-1" />
                )}
                Publicar
              </Button>
              <Button size="sm" variant="destructive" onClick={handleReject} disabled={publishing}>
                <XCircle className="h-4 w-4 mr-1" />
                Rechazar
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {drafts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No hay borradores</p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={drafts.length > 0 && selectedIds.size === drafts.length}
                onCheckedChange={toggleSelectAll}
              />
              <Label className="cursor-pointer text-sm" onClick={toggleSelectAll}>
                Seleccionar todos
              </Label>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="w-10 px-3 py-2"></th>
                      <th className="px-3 py-2 text-left font-medium">Nombre</th>
                      <th className="px-3 py-2 text-left font-medium">Categoría</th>
                      <th className="px-3 py-2 text-left font-medium hidden md:table-cell">
                        Dirección
                      </th>
                      <th className="px-3 py-2 text-left font-medium hidden lg:table-cell">
                        Teléfono
                      </th>
                      <th className="px-3 py-2 text-left font-medium hidden lg:table-cell">
                        Website
                      </th>
                      <th className="px-3 py-2 text-left font-medium">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drafts.map((draft) => {
                      const isSelected = selectedIds.has(draft.id)
                      return (
                        <tr
                          key={draft.id}
                          className={`border-t hover:bg-muted/20 ${isSelected ? 'bg-primary/5' : ''}`}
                        >
                          <td className="px-3 py-2">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelect(draft.id)}
                            />
                          </td>
                          <td className="px-3 py-2 font-medium">{draft.name}</td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {draft.venueCategories[0]?.category.name || '-'}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground hidden md:table-cell max-w-[200px] truncate">
                            {draft.address || '-'}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground hidden lg:table-cell">
                            {draft.phone || '-'}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground hidden lg:table-cell">
                            {draft.website ? (
                              <a
                                href={draft.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Sí
                              </a>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground text-xs">
                            {new Date(draft.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      )
                    })}
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
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

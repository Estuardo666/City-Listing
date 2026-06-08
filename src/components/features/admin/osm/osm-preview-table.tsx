'use client'

import { useState } from 'react'
import {
  Check,
  Loader2,
  Globe,
  Phone,
  MapPin,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { getOsmCategoryLabel } from '@/types/osm-import'
import type { OsmPlace, DuplicateCheckResult } from '@/types/osm-import'

interface PlaceWithStatus extends OsmPlace {
  isDuplicate: boolean
  duplicateInfo?: DuplicateCheckResult
}

interface OsmPreviewTableProps {
  places: PlaceWithStatus[]
  importId: string | null
  coordinates: { lat: number; lon: number } | null
  categories?: { id: string; name: string }[]
}

export function OsmPreviewTable({ places, importId, categories = [] }: OsmPreviewTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isImporting, setIsImporting] = useState(false)
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set())
  const [categoryIds, setCategoryIds] = useState<string[]>(
    categories.length > 0 ? [categories[0].id] : []
  )
  const [page, setPage] = useState(1)
  const perPage = 20
  const totalPages = Math.ceil(places.length / perPage)
  const paged = places.slice((page - 1) * perPage, page * perPage)

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const toggleAll = () => {
    const nonDup = paged.filter((p) => !p.isDuplicate)
    if (nonDup.every((p) => selected.has(p.id))) {
      const next = new Set(selected)
      nonDup.forEach((p) => next.delete(p.id))
      setSelected(next)
    } else {
      const next = new Set(selected)
      nonDup.forEach((p) => next.add(p.id))
      setSelected(next)
    }
  }

  const handleImport = async (placeList: PlaceWithStatus[]) => {
    setIsImporting(true)
    try {
      const res = await fetch('/api/admin/osm-import/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          places: placeList,
          categoryIds,
          importId,
          options: { skipDuplicates: true, updateExisting: false, batchSize: 20 },
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Error al importar')
      }

      const result = await res.json()
      setImportedIds((prev) => {
        const next = new Set(prev)
        placeList.forEach((p) => next.add(p.id))
        return next
      })
      setSelected(new Set())
      toast.success(`Importación completada: ${result.stats.imported} importados, ${result.stats.duplicates} duplicados`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al importar')
    } finally {
      setIsImporting(false)
    }
  }

  const selectedPlaces = places.filter((p) => selected.has(p.id))
  const nonDuplicatePlaces = places.filter((p) => !p.isDuplicate && !importedIds.has(p.id))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Vista previa de importación</CardTitle>
            <CardDescription>
              {places.length} lugares encontrados
              {places.filter((p) => p.isDuplicate).length > 0 && (
                <span> ({places.filter((p) => p.isDuplicate).length} duplicados)</span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mr-2">
                {categories.map((cat) => {
                  const isSelected = categoryIds.includes(cat.id)
                  return (
                    <Button
                      key={cat.id}
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setCategoryIds((prev) =>
                          isSelected ? prev.filter((id) => id !== cat.id) : [...prev, cat.id]
                        )
                      }}
                    >
                      {cat.name}
                    </Button>
                  )
                })}
              </div>
            )}
            <Button variant="outline" size="sm" onClick={toggleAll}>
              {paged.filter((p) => !p.isDuplicate).every((p) => selected.has(p.id))
                ? 'Deseleccionar página'
                : 'Seleccionar página'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleImport(nonDuplicatePlaces)}
              disabled={nonDuplicatePlaces.length === 0 || isImporting}
            >
              {isImporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Importar todo ({nonDuplicatePlaces.length})
            </Button>
            <Button
              size="sm"
              onClick={() => handleImport(selectedPlaces)}
              disabled={selectedPlaces.length === 0 || isImporting}
            >
              {isImporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Importar seleccionados ({selectedPlaces.length})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {paged.map((place) => (
            <div
              key={place.id}
              className={`flex items-start gap-4 rounded-xl border p-4 transition-colors ${
                place.isDuplicate
                  ? 'bg-muted/50 opacity-70'
                  : importedIds.has(place.id)
                  ? 'bg-emerald-50 dark:bg-emerald-950/20'
                  : 'bg-card hover:bg-accent/50'
              }`}
            >
              {!place.isDuplicate && !importedIds.has(place.id) && (
                <Checkbox
                  checked={selected.has(place.id)}
                  onCheckedChange={() => toggleSelect(place.id)}
                  className="mt-1"
                />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm truncate">{place.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {getOsmCategoryLabel(place.category)}
                  </Badge>
                  {place.isDuplicate && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Duplicado
                    </Badge>
                  )}
                  {importedIds.has(place.id) && (
                    <Badge className="text-xs bg-emerald-600">Importado</Badge>
                  )}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {place.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {place.address}
                    </span>
                  )}
                  {place.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {place.phone}
                    </span>
                  )}
                  {place.website && (
                    <a
                      href={place.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <Globe className="h-3 w-3" />
                      Web
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                  <span className="text-[10px] font-mono text-muted-foreground/60">
                    {place.lat.toFixed(5)}, {place.lon.toFixed(5)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <>
            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Página {page} de {totalPages} ({places.length} resultados)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
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

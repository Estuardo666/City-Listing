'use client'

import { useState } from 'react'
import { Check, X, AlertCircle, ArrowLeft, Loader2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

export interface PlaceResult {
  google_place_id: string
  name: string
  category: string
  address: string
  phone: string | null
  lat: number
  lng: number
  alreadyImported?: boolean
  existingVenue?: { id: string; name: string; slug: string } | null
}

interface WizardResultsProps {
  places: PlaceResult[]
  hasMore: boolean
  isLoadingMore: boolean
  onLoadMore: () => void
  onSelectForImport: (places: PlaceResult[]) => void
  onImportAll: () => void
  onBack: () => void
}

export function WizardResults({
  places,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onSelectForImport,
  onImportAll,
  onBack,
}: WizardResultsProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const selectedCount = selectedIds.size
  const totalAvailable = places.filter((p) => !p.alreadyImported).length
  const duplicateCount = places.filter((p) => p.alreadyImported).length

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    const available = places.filter((p) => !p.alreadyImported).map((p) => p.google_place_id)
    const allSelected = available.every((id) => selectedIds.has(id))

    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        available.forEach((id) => next.delete(id))
      } else {
        available.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const handleImportSelected = () => {
    const selected = places.filter(
      (p) => selectedIds.has(p.google_place_id) && !p.alreadyImported
    )
    onSelectForImport(selected)
  }

  const allSelected =
    places.filter((p) => !p.alreadyImported).length > 0 &&
    places.filter((p) => !p.alreadyImported).every((p) => selectedIds.has(p.google_place_id))

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-sm">
          <Badge variant="outline">Total: {places.length}</Badge>
          <Badge variant="default">Nuevos: {totalAvailable}</Badge>
          {duplicateCount > 0 && (
            <Badge variant="secondary">Duplicados: {duplicateCount}</Badge>
          )}
          {selectedCount > 0 && (
            <Badge variant="default">Seleccionados: {selectedCount}</Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
        <Label className="text-sm cursor-pointer" onClick={toggleSelectAll}>
          Seleccionar todos
        </Label>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0 z-10">
              <tr>
                <th className="w-10 px-3 py-2"></th>
                <th className="px-3 py-2 text-left font-medium">Nombre</th>
                <th className="px-3 py-2 text-left font-medium">Categoría</th>
                <th className="px-3 py-2 text-left font-medium hidden md:table-cell">
                  Dirección
                </th>
                <th className="px-3 py-2 text-left font-medium hidden lg:table-cell">Teléfono</th>
                <th className="px-3 py-2 text-left font-medium hidden xl:table-cell">Lat</th>
                <th className="px-3 py-2 text-left font-medium hidden xl:table-cell">Lng</th>
                <th className="px-3 py-2 text-left font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {places.map((place) => {
                const isSelected = selectedIds.has(place.google_place_id)
                return (
                  <tr
                    key={place.google_place_id}
                    className={`border-t ${
                      place.alreadyImported
                        ? 'bg-muted/30 opacity-60'
                        : isSelected
                          ? 'bg-primary/5'
                          : 'hover:bg-muted/20'
                    }`}
                  >
                    <td className="px-3 py-2">
                      {!place.alreadyImported && (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(place.google_place_id)}
                        />
                      )}
                    </td>
                    <td className="px-3 py-2 font-medium max-w-[200px] truncate">{place.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{place.category}</td>
                    <td className="px-3 py-2 text-muted-foreground hidden md:table-cell max-w-[250px] truncate">
                      {place.address}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground hidden lg:table-cell">
                      {place.phone || '-'}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground hidden xl:table-cell font-mono text-xs">
                      {place.lat.toFixed(6)}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground hidden xl:table-cell font-mono text-xs">
                      {place.lng.toFixed(6)}
                    </td>
                    <td className="px-3 py-2">
                      {place.alreadyImported ? (
                        <Badge variant="secondary" className="text-xs">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Duplicado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-green-600">
                          Nuevo
                        </Badge>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cargando...
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Cargar más resultados
              </>
            )}
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 justify-end">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Nueva búsqueda
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleImportSelected}
          disabled={selectedCount === 0}
        >
          <Check className="h-4 w-4 mr-1" />
          Importar seleccionados ({selectedCount})
        </Button>
        <Button variant="secondary" size="sm" onClick={onImportAll}>
          Importar todos ({totalAvailable})
        </Button>
      </div>
    </div>
  )
}

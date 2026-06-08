'use client'

import { useState, useMemo } from 'react'
import { Check, X, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PlaceResult } from './wizard-results'
import type { DuplicateCheckResult } from '@/types/google-import'

interface GoogleImportPreviewProps {
  places: PlaceResult[]
  duplicates: Map<string, DuplicateCheckResult>
  categories: { id: string; name: string }[]
  onImport: (selectedPlaces: PlaceResult[], categoryId: string, duplicateAction: 'skip' | 'update') => void
  onCancel: () => void
  isImporting: boolean
}

export function GoogleImportPreview({
  places,
  duplicates,
  categories,
  onImport,
  onCancel,
  isImporting,
}: GoogleImportPreviewProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(places.filter((p) => !p.alreadyImported).map((p) => p.google_place_id))
  )
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '')
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'update'>('skip')

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

  const handleImport = () => {
    const selected = places.filter((p) => selectedIds.has(p.google_place_id))
    onImport(selected, categoryId, duplicateAction)
  }

  const selectedCount = selectedIds.size
  const duplicateCount = places.filter((p) => p.alreadyImported).length
  const newCount = places.filter((p) => !p.alreadyImported).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview antes de importar</CardTitle>
        <div className="flex flex-wrap gap-3 text-sm">
          <Badge variant="outline">Total: {places.length}</Badge>
          <Badge variant="default">Nuevos: {newCount}</Badge>
          <Badge variant="secondary">Duplicados: {duplicateCount}</Badge>
          <Badge variant="default">Seleccionados: {selectedCount}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Categoría para importar</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Acción para duplicados</Label>
            <Select
              value={duplicateAction}
              onValueChange={(v) => setDuplicateAction(v as 'skip' | 'update')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="skip">Omitir duplicados</SelectItem>
                <SelectItem value="update">Actualizar existentes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            checked={
              places.filter((p) => !p.alreadyImported).length > 0 &&
              places
                .filter((p) => !p.alreadyImported)
                .every((p) => selectedIds.has(p.google_place_id))
            }
            onCheckedChange={toggleSelectAll}
          />
          <Label className="cursor-pointer" onClick={toggleSelectAll}>
            Seleccionar todos
          </Label>
        </div>

        <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="w-10 px-3 py-2"></th>
                <th className="px-3 py-2 text-left font-medium">Nombre</th>
                <th className="px-3 py-2 text-left font-medium">Categoría</th>
                <th className="px-3 py-2 text-left font-medium hidden md:table-cell">
                  Dirección
                </th>
                <th className="px-3 py-2 text-left font-medium hidden lg:table-cell">Teléfono</th>
                <th className="px-3 py-2 text-left font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {places.map((place) => {
                const isSelected = selectedIds.has(place.google_place_id)
                const dup = duplicates.get(place.google_place_id)
                return (
                  <tr
                    key={place.google_place_id}
                    className={`border-t ${place.alreadyImported ? 'bg-muted/30' : isSelected ? 'bg-primary/5' : ''}`}
                  >
                    <td className="px-3 py-2">
                      {!place.alreadyImported && (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(place.google_place_id)}
                        />
                      )}
                    </td>
                    <td className="px-3 py-2 font-medium">{place.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{place.category}</td>
                    <td className="px-3 py-2 text-muted-foreground hidden md:table-cell max-w-[200px] truncate">
                      {place.address}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground hidden lg:table-cell">
                      {place.phone || '-'}
                    </td>
                    <td className="px-3 py-2">
                      {place.alreadyImported ? (
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary" className="text-xs">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Duplicado
                          </Badge>
                          {dup?.matchType && (
                            <span className="text-xs text-muted-foreground">
                              ({dup.matchType})
                            </span>
                          )}
                        </div>
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

        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="default" onClick={handleImport} disabled={selectedCount === 0 || isImporting}>
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Importar seleccionados ({selectedCount})
              </>
            )}
          </Button>
          <Button variant="ghost" onClick={onCancel} disabled={isImporting}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

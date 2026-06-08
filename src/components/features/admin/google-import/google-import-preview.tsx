'use client'

import { useState, useEffect, useMemo } from 'react'
import { Check, X, AlertCircle, Loader2, ChevronDown, ChevronRight, Sparkles } from 'lucide-react'
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

type Subcategory = { id: string; name: string; slug: string; icon: string | null }
type Category = { id: string; name: string; slug: string; icon: string | null; subcategories: Subcategory[] }

interface GoogleImportPreviewProps {
  places: PlaceResult[]
  duplicates: Map<string, DuplicateCheckResult>
  categories: Category[]
  onImport: (selectedPlaces: PlaceResult[], categoryIds: string[], duplicateAction: 'skip' | 'update') => void
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
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [subcategoryIds, setSubcategoryIds] = useState<string[]>([])
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'update'>('skip')
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set())
  const [autoMapped, setAutoMapped] = useState(false)

  // Auto-map categories based on Google Place types
  useEffect(() => {
    if (autoMapped || places.length === 0) return

    const googleTypes = new Map<string, number>()
    for (const place of places) {
      const type = place.category || ''
      if (type) {
        googleTypes.set(type, (googleTypes.get(type) || 0) + 1)
      }
    }

    // Find the most common Google type
    const sortedTypes = [...googleTypes.entries()].sort((a, b) => b[1] - a[1])
    if (sortedTypes.length === 0) return

    // Try to auto-map using the first place's type
    const primaryType = sortedTypes[0][0].toLowerCase().replace(/\s+/g, '_')

    // Simple keyword matching for auto-suggestion
    const KEYWORD_MAP: Record<string, { catSlug: string; subSlug?: string }> = {
      gym: { catSlug: 'salud-bienestar', subSlug: 'gimnasios' },
      fitness: { catSlug: 'salud-bienestar', subSlug: 'gimnasios' },
      restaurant: { catSlug: 'gastronomia', subSlug: 'restaurantes' },
      cafe: { catSlug: 'gastronomia', subSlug: 'cafeterias' },
      bar: { catSlug: 'gastronomia', subSlug: 'bares' },
      hotel: { catSlug: 'alojamiento', subSlug: 'hoteles' },
      lodging: { catSlug: 'alojamiento', subSlug: 'hoteles' },
      hospital: { catSlug: 'salud-bienestar', subSlug: 'hospitales' },
      pharmacy: { catSlug: 'salud-bienestar', subSlug: 'farmacias' },
      school: { catSlug: 'educacion', subSlug: 'escuelas' },
      supermarket: { catSlug: 'compras', subSlug: 'supermercados' },
      bank: { catSlug: 'finanzas', subSlug: 'bancos' },
      store: { catSlug: 'compras', subSlug: 'tiendas' },
      shop: { catSlug: 'compras', subSlug: 'tiendas' },
      mall: { catSlug: 'compras', subSlug: 'centros-comerciales' },
      gas_station: { catSlug: 'automotriz-transporte', subSlug: 'gasolineras' },
      car: { catSlug: 'automotriz-transporte', subSlug: 'concesionarios' },
      beauty: { catSlug: 'belleza', subSlug: 'peluquerias' },
      salon: { catSlug: 'belleza', subSlug: 'peluquerias' },
      spa: { catSlug: 'belleza', subSlug: 'spa-belleza' },
      pet: { catSlug: 'mascotas', subSlug: 'pet-shops' },
      veterinary: { catSlug: 'mascotas', subSlug: 'veterinarias' },
      museum: { catSlug: 'cultura', subSlug: 'museos' },
      theater: { catSlug: 'cultura', subSlug: 'teatros' },
      cinema: { catSlug: 'entretenimiento', subSlug: 'cines' },
      nightclub: { catSlug: 'entretenimiento', subSlug: 'night-clubs' },
      stadium: { catSlug: 'deportes', subSlug: 'complejos-deportivos' },
      bakery: { catSlug: 'gastronomia', subSlug: 'panaderias' },
      doctor: { catSlug: 'salud-bienestar', subSlug: 'medicos' },
      dentist: { catSlug: 'salud-bienestar', subSlug: 'dentistas' },
      lawyer: { catSlug: 'empresas-servicios', subSlug: 'legal' },
      real_estate: { catSlug: 'inmobiliaria', subSlug: 'bienes-raices' },
      university: { catSlug: 'educacion', subSlug: 'universidades' },
      library: { catSlug: 'educacion', subSlug: 'bibliotecas' },
    }

    let matched = false
    for (const [keyword, mapping] of Object.entries(KEYWORD_MAP)) {
      if (primaryType.includes(keyword)) {
        const cat = categories.find((c) => c.slug === mapping.catSlug)
        if (cat) {
          setCategoryIds([cat.id])
          if (mapping.subSlug) {
            const sub = cat.subcategories.find((s) => s.slug === mapping.subSlug)
            if (sub) setSubcategoryIds([sub.id])
          }
          setExpandedCats(new Set([cat.id]))
          matched = true
          break
        }
      }
    }

    if (!matched && categories.length > 0) {
      setCategoryIds([categories[0].id])
      setExpandedCats(new Set([categories[0].id]))
    }

    setAutoMapped(true)
  }, [places, categories, autoMapped])

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

  const toggleCategory = (catId: string) => {
    setCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    )
    setExpandedCats((prev) => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }

  const toggleSubcategory = (subId: string) => {
    setSubcategoryIds((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    )
  }

  const handleImport = () => {
    const selected = places.filter((p) => selectedIds.has(p.google_place_id))
    // Send categoryIds (subcategories are optional enhancement)
    onImport(selected, categoryIds, duplicateAction)
  }

  const selectedCount = selectedIds.size
  const duplicateCount = places.filter((p) => p.alreadyImported).length
  const newCount = places.filter((p) => !p.alreadyImported).length

  // Get detected Google type for display
  const detectedType = useMemo(() => {
    const types = new Map<string, number>()
    for (const place of places) {
      const type = place.category || ''
      if (type) types.set(type, (types.get(type) || 0) + 1)
    }
    const sorted = [...types.entries()].sort((a, b) => b[1] - a[1])
    return sorted[0]?.[0] || null
  }, [places])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview antes de importar</CardTitle>
        <div className="flex flex-wrap gap-3 text-sm">
          <Badge variant="outline">Total: {places.length}</Badge>
          <Badge variant="default">Nuevos: {newCount}</Badge>
          <Badge variant="secondary">Duplicados: {duplicateCount}</Badge>
          <Badge variant="default">Seleccionados: {selectedCount}</Badge>
          {detectedType && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Sparkles className="w-3 h-3 mr-1" />
              Google Type: {detectedType}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Selection - Hierarchical */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Categorías para importar</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {categories.map((cat) => {
              const isSelected = categoryIds.includes(cat.id)
              const isExpanded = expandedCats.has(cat.id)
              const selectedSubs = cat.subcategories.filter((s) => subcategoryIds.includes(s.id))

              return (
                <div key={cat.id} className="rounded-lg border border-border/50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card hover:bg-muted/50'
                    }`}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                    )}
                    {cat.icon && <span className="text-base">{cat.icon}</span>}
                    <span className="flex-1 truncate">{cat.name}</span>
                    {cat.subcategories.length > 0 && (
                      <span className="text-xs opacity-70">{cat.subcategories.length}</span>
                    )}
                  </button>

                  {isExpanded && cat.subcategories.length > 0 && (
                    <div className="border-t border-border/30 bg-muted/20 p-2">
                      <div className="flex flex-wrap gap-1">
                        {cat.subcategories.map((sub) => {
                          const isSubSelected = subcategoryIds.includes(sub.id)
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => toggleSubcategory(sub.id)}
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                                isSubSelected
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-background text-muted-foreground hover:bg-muted border border-border/50'
                              }`}
                            >
                              {sub.icon && <span className="mr-1">{sub.icon}</span>}
                              {sub.name}
                            </button>
                          )
                        })}
                      </div>
                      {selectedSubs.length > 0 && (
                        <p className="mt-1.5 text-xs text-emerald-600">
                          {selectedSubs.length} subcategoría{selectedSubs.length !== 1 ? 's' : ''} seleccionada{selectedSubs.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Selecciona las categorías padre. Las subcategorías son opcionales para clasificación más específica.
          </p>
        </div>

        {/* Duplicate Action */}
        <div className="space-y-2">
          <Label>Acción para duplicados</Label>
          <Select
            value={duplicateAction}
            onValueChange={(v) => setDuplicateAction(v as 'skip' | 'update')}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="skip">Omitir duplicados</SelectItem>
              <SelectItem value="update">Actualizar existentes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Select All */}
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

        {/* Table */}
        <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="w-10 px-3 py-2"></th>
                <th className="px-3 py-2 text-left font-medium">Nombre</th>
                <th className="px-3 py-2 text-left font-medium">Categoría Google</th>
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
                    <td className="px-3 py-2 text-muted-foreground">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{place.category}</code>
                    </td>
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

        {/* Actions */}
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="default" onClick={handleImport} disabled={selectedCount === 0 || categoryIds.length === 0 || isImporting}>
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

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Search,
  Loader2,
  MapPin,
  UtensilsCrossed,
  Coffee,
  Hotel,
  Beer,
  Pill,
  Hospital,
  Dumbbell,
  Landmark,
  ShoppingCart,
  GraduationCap,
  Store,
  Fuel,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { OsmSearchSchema, type OsmSearchInput } from '@/schemas/osm-import'
import { OSM_CATEGORIES } from '@/types/osm-import'
import { OsmPreviewTable } from './osm-preview-table'
import type { OsmPlace, DuplicateCheckResult } from '@/types/osm-import'

const ICON_MAP: Record<string, React.ElementType> = {
  UtensilsCrossed, Coffee, Hotel, Beer, Pill, Hospital, Dumbbell, Landmark, ShoppingCart, GraduationCap, Store, Fuel,
}

const COUNTRIES = [
  { value: 'Ecuador', label: 'Ecuador' },
  { value: 'Colombia', label: 'Colombia' },
  { value: 'Peru', label: 'Perú' },
  { value: 'Argentina', label: 'Argentina' },
  { value: 'Chile', label: 'Chile' },
  { value: 'Mexico', label: 'México' },
  { value: 'Spain', label: 'España' },
]

interface PlaceWithStatus extends OsmPlace {
  isDuplicate: boolean
  duplicateInfo?: DuplicateCheckResult
}

export function OsmImportForm() {
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<PlaceWithStatus[]>([])
  const [importId, setImportId] = useState<string | null>(null)
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(null)

  const form = useForm<OsmSearchInput>({
    resolver: zodResolver(OsmSearchSchema),
    defaultValues: {
      city: '',
      country: 'Ecuador',
      radius: 5000,
      categories: [],
    },
  })

  const selectedCategories = form.watch('categories')

  const toggleCategory = (key: string) => {
    const current = form.getValues('categories')
    if (current.includes(key)) {
      form.setValue('categories', current.filter((c) => c !== key))
    } else {
      form.setValue('categories', [...current, key])
    }
  }

  const handleSearch = async (data: OsmSearchInput) => {
    setIsSearching(true)
    setResults([])
    setImportId(null)

    try {
      const params = new URLSearchParams({
        city: data.city,
        country: data.country,
        radius: String(data.radius),
        categories: data.categories.join(','),
      })

      const res = await fetch(`/api/admin/osm-import/search?${params}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Error al buscar')
      }

      const result = await res.json()
      setResults(result.data)
      setImportId(result.importId)
      setCoordinates(result.coordinates)

      if (result.data.length === 0) {
        toast.info('No se encontraron lugares con esos criterios')
      } else {
        toast.success(`Se encontraron ${result.data.length} lugares (${result.duplicates} duplicados)`)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al buscar lugares')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Buscar lugares en OpenStreetMap</CardTitle>
          <CardDescription>
            Configura los parámetros de búsqueda para importar lugares desde OSM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSearch)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  placeholder="Ej: Loja, Quito, Guayaquil..."
                  {...form.register('city')}
                />
                {form.formState.errors.city && (
                  <p className="text-sm text-destructive">{form.formState.errors.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <select
                  id="country"
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  {...form.register('country')}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="radius">Radio de búsqueda: {(form.watch('radius') / 1000).toFixed(1)} km</Label>
                <Input
                  id="radius"
                  type="range"
                  min={100}
                  max={50000}
                  step={100}
                  {...form.register('radius', { valueAsNumber: true })}
                  className="accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>100m</span>
                  <span>50km</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Categorías OSM</Label>
              {form.formState.errors.categories && (
                <p className="text-sm text-destructive">{form.formState.errors.categories.message}</p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(OSM_CATEGORIES).map(([key, cat]) => {
                  const Icon = ICON_MAP[cat.icon] ?? MapPin
                  const checked = selectedCategories.includes(key)
                  return (
                    <label
                      key={key}
                      className={`flex items-center gap-2.5 rounded-xl border p-3 cursor-pointer transition-colors ${
                        checked ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleCategory(key)}
                      />
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm font-medium">{cat.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <Button type="submit" disabled={isSearching} className="w-full md:w-auto">
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando en Overpass API...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar lugares
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <OsmPreviewTable
          places={results}
          importId={importId}
          coordinates={coordinates}
        />
      )}
    </div>
  )
}

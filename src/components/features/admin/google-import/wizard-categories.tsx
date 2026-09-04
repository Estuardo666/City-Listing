'use client'

import { useState } from 'react'
import { Search, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { GOOGLE_CATEGORIES } from '@/types/google-import'
import type { LogEntry } from './log-feed'
import { createLog } from './log-feed'

interface WizardCategoriesProps {
  onSearch: (categories: string[]) => void
  onBack: () => void
  onAddLog: (log: LogEntry) => void
  isSearching: boolean
}

export function WizardCategories({
  onSearch,
  onBack,
  onAddLog,
  isSearching,
}: WizardCategoriesProps) {
  const [selected, setSelected] = useState<string[]>(Object.keys(GOOGLE_CATEGORIES))

  const toggleCategory = (key: string) => {
    if (isSearching) return
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const handleSelectAll = () => {
    const allKeys = Object.keys(GOOGLE_CATEGORIES)
    if (selected.length === allKeys.length) {
      setSelected([])
    } else {
      setSelected(allKeys)
    }
  }

  const handleSearch = () => {
    if (selected.length === 0) return
    onAddLog(
      createLog(
        'info',
        `Categorías seleccionadas: ${selected.map((k) => GOOGLE_CATEGORIES[k]?.label).join(', ')}`
      )
    )
    onSearch(selected)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Categorías a buscar</Label>
        <Button variant="ghost" size="sm" onClick={handleSelectAll} disabled={isSearching}>
          {selected.length === Object.keys(GOOGLE_CATEGORIES).length
            ? 'Deseleccionar todas'
            : 'Seleccionar todas'}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Incluye comercios, profesionales y servicios. Se buscará por categoría y por sectores del radio elegido.
        Ampliar la cobertura requiere más consultas a Google y puede aumentar el costo.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
        {Object.entries(GOOGLE_CATEGORIES).map(([key, cat]) => (
          <div
            key={key}
            className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
              selected.includes(key)
                ? 'bg-primary/5 border-primary/30'
                : 'hover:bg-muted/50'
            }`}
            onClick={() => toggleCategory(key)}
          >
            <Checkbox
              onClick={(event) => event.stopPropagation()}
              disabled={isSearching}
              aria-label={cat.label}
              checked={selected.includes(key)}
              onCheckedChange={() => toggleCategory(key)}
            />
            <Label className="cursor-pointer text-sm">{cat.label}</Label>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        {selected.length} categoría{selected.length !== 1 ? 's' : ''} seleccionada
        {selected.length !== 1 ? 's' : ''}. {selected.length * 10} búsquedas de cobertura, más sus páginas adicionales.
      </p>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} disabled={isSearching}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Atrás
        </Button>
        <Button
          onClick={handleSearch}
          disabled={selected.length === 0 || isSearching}
          className="flex-1"
        >
          {isSearching ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Buscando...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Buscar negocios
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

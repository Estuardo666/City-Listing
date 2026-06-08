'use client'

import { useState } from 'react'
import { Search, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { GOOGLE_CATEGORIES, type GoogleCategoryKey } from '@/types/google-import'
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
  const [selected, setSelected] = useState<string[]>(['restaurant'])

  const toggleCategory = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const handleSelectAll = () => {
    const allKeys = Object.keys(GOOGLE_CATEGORIES)
    if (selected.length === allKeys.length) {
      setSelected(['restaurant'])
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
        <Button variant="ghost" size="sm" onClick={handleSelectAll}>
          {selected.length === Object.keys(GOOGLE_CATEGORIES).length
            ? 'Deseleccionar todas'
            : 'Seleccionar todas'}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
              checked={selected.includes(key)}
              onCheckedChange={() => toggleCategory(key)}
            />
            <Label className="cursor-pointer text-sm">{cat.label}</Label>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        {selected.length} categoría{selected.length !== 1 ? 's' : ''} seleccionada
        {selected.length !== 1 ? 's' : ''}
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

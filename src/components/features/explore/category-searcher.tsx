'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type Category = {
  id: string
  name: string
  slug: string
  icon: string | null
}

type CategorySearcherProps = {
  categories: Category[]
  selectedCategories: string[]
  onCategoriesChange: (slugs: string[]) => void
  className?: string
}

export function CategorySearcher({ categories, selectedCategories, onCategoriesChange, className }: CategorySearcherProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categories
    return categories.filter((cat) =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.slug.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [categories, searchTerm])

  const selectedCategoryData = categories.filter((cat) => selectedCategories.includes(cat.slug))

  const handleSelect = (slug: string) => {
    onCategoriesChange(
      selectedCategories.includes(slug)
        ? selectedCategories.filter((s) => s !== slug)
        : [...selectedCategories, slug]
    )
  }

  const handleClear = () => {
    onCategoriesChange([])
    setSearchTerm('')
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Search input */}
      <div className="relative shrink-0">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar categoría..."
          className="h-9 w-full rounded-lg border border-border/60 bg-secondary/40 pl-9 pr-7 text-sm placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Selected categories display */}
      {selectedCategoryData.length > 0 && (
        <div className="mt-2 flex shrink-0 flex-wrap gap-1">
          {selectedCategoryData.map((cat) => (
            <div key={cat.id} className="flex items-center gap-1 rounded-lg border border-primary/30 bg-primary px-2.5 py-1.5">
              <span className="text-sm font-medium text-white">
                {cat.name}
              </span>
              <button
                type="button"
                onClick={() => handleSelect(cat.slug)}
                className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 rounded-lg border border-border/60 px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-accent"
          >
            <X className="h-3 w-3" />
            Limpiar
          </button>
        </div>
      )}

      {/* "Todas" button — always visible */}
      <button
        type="button"
        onClick={() => onCategoriesChange([])}
        className={cn(
          'mt-2 w-full shrink-0 rounded-lg border px-2.5 py-1.5 font-medium transition-all chip-14',
          selectedCategories.length === 0
            ? 'border-primary/30 bg-primary text-white'
            : 'border-border/60 bg-background text-muted-foreground hover:border-primary/30 hover:text-primary'
        )}
      >
        Todas las categorías
      </button>

      {/* Categories chips — scrollable */}
      <div className="mt-2 max-h-[40vh] overflow-y-auto explore-scrollbar">
        <div className="flex flex-wrap gap-1.5">
          {filteredCategories.map((category) => (
            <motion.button
              key={category.id}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect(category.slug)}
              className={cn(
                'rounded-lg border font-medium transition-all whitespace-nowrap chip-14',
                selectedCategories.includes(category.slug)
                  ? 'border-primary bg-primary text-white'
                  : 'border-border/60 bg-secondary/40 text-foreground hover:border-primary/40 hover:bg-primary/8 hover:text-primary'
              )}
            >
              {category.name}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Show message when search has no results */}
      {searchTerm && filteredCategories.length === 0 && (
        <p className="py-4 text-center text-xs text-muted-foreground">
          No se encontraron categorías para "{searchTerm}"
        </p>
      )}
    </div>
  )
}

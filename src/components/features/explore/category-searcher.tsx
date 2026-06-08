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
  selectedCategory: string
  onCategoryChange: (category: string) => void
  className?: string
}

export function CategorySearcher({ categories, selectedCategory, onCategoryChange, className }: CategorySearcherProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categories
    return categories.filter((cat) =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.slug.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [categories, searchTerm])

  const selectedCategoryData = categories.find((cat) => cat.slug === selectedCategory)

  const handleSelect = (slug: string) => {
    onCategoryChange(slug === selectedCategory ? '' : slug)
  }

  const handleClear = () => {
    onCategoryChange('')
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

      {/* Selected category display */}
      {selectedCategoryData && (
        <div className="mt-2 flex shrink-0 items-center justify-between rounded-lg border border-primary/30 bg-primary px-3 py-2">
          <span className="flex items-center gap-2 text-sm font-medium text-white">
            {selectedCategoryData.name}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* "Todas" button — always visible */}
      <button
        type="button"
        onClick={() => handleSelect('')}
        className={cn(
          'mt-2 w-full shrink-0 rounded-lg border px-2.5 py-1.5 font-medium transition-all chip-14',
          selectedCategory === ''
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
                selectedCategory === category.slug
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

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
    <div className={cn('space-y-3', className)}>
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar categoría..."
          className="h-9 w-full rounded-xl border border-border/60 bg-secondary/40 pl-9 pr-7 text-sm placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
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
        <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary px-3 py-2">
          <span className="flex items-center gap-2 text-sm font-medium text-white">
            <span>{selectedCategoryData.icon}</span>
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

      {/* Categories grid - always visible */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => handleSelect('')}
          className={cn(
            'col-span-2 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-all',
            selectedCategory === ''
              ? 'border-primary/30 bg-primary text-white'
              : 'border-border/60 bg-background text-muted-foreground hover:border-primary/30 hover:text-primary'
          )}
        >
          Todas las categorías
        </button>
        {filteredCategories.map((category) => (
          <motion.button
            key={category.id}
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelect(category.slug)}
            className={cn(
              'rounded-full border px-2 py-1 text-xs font-medium transition-all text-left',
              selectedCategory === category.slug
                ? 'border-primary bg-primary text-white'
                : 'border-border/60 bg-secondary/40 text-foreground hover:border-primary/40 hover:bg-primary/8 hover:text-primary'
            )}
          >
            <span className="mr-1">{category.icon}</span>
            {category.name}
          </motion.button>
        ))}
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

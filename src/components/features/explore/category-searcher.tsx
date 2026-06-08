'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type Subcategory = {
  id: string
  name: string
  slug: string
  icon: string | null
}

type Category = {
  id: string
  name: string
  slug: string
  icon: string | null
  subcategories?: Subcategory[]
}

type CategorySearcherProps = {
  categories: Category[]
  selectedCategories: string[]
  onCategoriesChange: (slugs: string[]) => void
  className?: string
}

export function CategorySearcher({ categories, selectedCategories, onCategoriesChange, className }: CategorySearcherProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set())

  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categories
    const term = searchTerm.toLowerCase()
    return categories.filter((cat) => {
      const parentMatch = cat.name.toLowerCase().includes(term) || cat.slug.toLowerCase().includes(term)
      const childMatch = cat.subcategories?.some(
        (sub) => sub.name.toLowerCase().includes(term) || sub.slug.toLowerCase().includes(term)
      )
      return parentMatch || childMatch
    })
  }, [categories, searchTerm])

  const selectedCategoryData = useMemo(() => {
    const selected: { name: string; slug: string; isSub: boolean; parentName?: string }[] = []
    for (const cat of categories) {
      if (selectedCategories.includes(cat.slug)) {
        selected.push({ name: cat.name, slug: cat.slug, isSub: false })
      }
      for (const sub of cat.subcategories ?? []) {
        if (selectedCategories.includes(sub.slug)) {
          selected.push({ name: sub.name, slug: sub.slug, isSub: true, parentName: cat.name })
        }
      }
    }
    return selected
  }, [categories, selectedCategories])

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

  const toggleExpand = (catId: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
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
          placeholder="Buscar categoría o subcategoría..."
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
          {selectedCategoryData.map((item) => (
            <div key={item.slug} className="flex items-center gap-1 rounded-lg border border-primary/30 bg-primary px-2.5 py-1.5">
              <span className="text-sm font-medium text-white">
                {item.isSub ? `${item.parentName} → ${item.name}` : item.name}
              </span>
              <button
                type="button"
                onClick={() => handleSelect(item.slug)}
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

      {/* "Todas" button */}
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

      {/* Categories with subcategories */}
      <div className="mt-2 max-h-[40vh] overflow-y-auto explore-scrollbar">
        <div className="flex flex-col gap-1.5">
          {filteredCategories.map((category) => {
            const hasSubs = (category.subcategories?.length ?? 0) > 0
            const isExpanded = expandedCats.has(category.id) || searchTerm.length > 0
            const isParentSelected = selectedCategories.includes(category.slug)
            const selectedSubs = category.subcategories?.filter((s) => selectedCategories.includes(s.slug)) ?? []

            return (
              <div key={category.id}>
                {/* Parent category */}
                <div className="flex items-center gap-1">
                  {hasSubs && (
                    <button
                      type="button"
                      onClick={() => toggleExpand(category.id)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted"
                    >
                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </button>
                  )}
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelect(category.slug)}
                    className={cn(
                      'flex-1 rounded-lg border px-2.5 py-1.5 text-left font-medium transition-all whitespace-nowrap chip-14',
                      isParentSelected
                        ? 'border-primary bg-primary text-white'
                        : 'border-border/60 bg-secondary/40 text-foreground hover:border-primary/40 hover:bg-primary/8 hover:text-primary'
                    )}
                  >
                    {category.icon && <span className="mr-1.5">{category.icon}</span>}
                    {category.name}
                    {selectedSubs.length > 0 && (
                      <span className="ml-1.5 text-xs opacity-70">+{selectedSubs.length}</span>
                    )}
                  </motion.button>
                </div>

                {/* Subcategories */}
                {hasSubs && isExpanded && (
                  <div className="ml-7 mt-1 flex flex-wrap gap-1">
                    {category.subcategories!.map((sub) => {
                      const isSubSelected = selectedCategories.includes(sub.slug)
                      return (
                        <motion.button
                          key={sub.id}
                          type="button"
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleSelect(sub.slug)}
                          className={cn(
                            'rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
                            isSubSelected
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-border/60 bg-background text-muted-foreground hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700'
                          )}
                        >
                          {sub.icon && <span className="mr-1">{sub.icon}</span>}
                          {sub.name}
                        </motion.button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* No results message */}
      {searchTerm && filteredCategories.length === 0 && (
        <p className="py-4 text-center text-xs text-muted-foreground">
          No se encontraron categorías para &quot;{searchTerm}&quot;
        </p>
      )}
    </div>
  )
}

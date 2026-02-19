'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, useDeferredValue } from 'react'
import type { EventCategory } from '@/types/event'

type EventFiltersProps = {
  categories: EventCategory[]
}

export function EventFiltersClient({ categories }: EventFiltersProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [featured, setFeatured] = useState(searchParams.get('featured') || 'all')
  
  const deferredQuery = useDeferredValue(query)
  
  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    
    if (deferredQuery) {
      params.set('q', deferredQuery)
    } else {
      params.delete('q')
    }
    
    params.set('category', category)
    if (featured !== 'all') {
      params.set('featured', featured)
    } else {
      params.delete('featured')
    }
    
    const newUrl = `${pathname}?${params.toString()}`
    router.push(newUrl, { scroll: false })
  }, [deferredQuery, category, featured, pathname, router, searchParams])
  
  const handleClear = () => {
    setQuery('')
    setCategory('')
    setFeatured('all')
    router.push(pathname, { scroll: false })
  }
  
  return (
    <div className="surface-glass rounded-2xl p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
        <div className="md:col-span-5">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="q">
            Buscar
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              id="q" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Eventos, lugares, direcciones..." 
              className="pl-9" 
            />
          </div>
        </div>

        <div className="md:col-span-4">
          <label
            className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            htmlFor="category"
          >
            Categoría
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-11 w-full rounded-xl border border-input/80 bg-white/80 px-4 text-sm text-foreground shadow-[0_8px_20px_-18px_rgba(15,23,42,0.65)] ring-offset-background transition-all duration-200 focus-visible:border-primary/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
          >
            <option value="">Todas</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="featured">
            Destacados
          </label>
          <select
            id="featured"
            value={featured}
            onChange={(e) => setFeatured(e.target.value)}
            className="h-11 w-full rounded-xl border border-input/80 bg-white/80 px-4 text-sm text-foreground shadow-[0_8px_20px_-18px_rgba(15,23,42,0.65)] ring-offset-background transition-all duration-200 focus-visible:border-primary/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
          >
            <option value="all">Todos</option>
            <option value="true">Solo destacados</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button 
          onClick={handleClear}
          className="h-9 border border-border/80 bg-background/75 px-4 text-xs text-foreground hover:bg-accent"
        >
          Limpiar filtros
        </Button>
      </div>
    </div>
  )
}

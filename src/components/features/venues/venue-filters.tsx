import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { VenueCategory } from '@/types/venue'

type VenueFiltersProps = {
  categories: VenueCategory[]
  currentQuery: string
  currentCategory: string
  featuredOnly: boolean
}

export function VenueFilters({
  categories,
  currentQuery,
  currentCategory,
  featuredOnly,
}: VenueFiltersProps) {
  return (
    <form className="surface-glass rounded-2xl p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
        <div className="md:col-span-5">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="q">
            Buscar
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="q" name="q" defaultValue={currentQuery} placeholder="Locales, direcciones, barrios..." className="pl-9" />
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
            name="category"
            defaultValue={currentCategory}
            className="h-11 w-full rounded-xl border border-input/80 bg-white/80 px-4 text-sm text-foreground shadow-[0_8px_20px_-18px_rgba(15,23,42,0.65)] ring-offset-background transition-all duration-200 focus-visible:border-primary/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
          >
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
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
            name="featured"
            defaultValue={featuredOnly ? 'true' : 'all'}
            className="h-11 w-full rounded-xl border border-input/80 bg-white/80 px-4 text-sm text-foreground shadow-[0_8px_20px_-18px_rgba(15,23,42,0.65)] ring-offset-background transition-all duration-200 focus-visible:border-primary/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
          >
            <option value="all">Todos</option>
            <option value="true">Solo destacados</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="submit" className="h-9 px-4 text-xs">
          Aplicar filtros
        </Button>
        <Button
          type="submit"
          formAction="/locales"
          className="h-9 border border-border/80 bg-background/75 px-4 text-xs text-foreground hover:bg-accent"
        >
          Limpiar
        </Button>
      </div>
    </form>
  )
}

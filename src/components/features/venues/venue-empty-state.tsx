import Link from 'next/link'
import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

type VenueEmptyStateProps = {
  hasFilters: boolean
}

export function VenueEmptyState({ hasFilters }: VenueEmptyStateProps) {
  return (
    <div className="surface-glass rounded-2xl p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <SearchX className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-semibold">No encontramos locales</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {hasFilters
          ? 'Intenta ajustar los filtros para descubrir más resultados.'
          : 'Aún no hay locales aprobados. Vuelve pronto para ver novedades en Loja.'}
      </p>
      {hasFilters ? (
        <div className="mt-5">
          <Button asChild>
            <Link href="/locales">Limpiar filtros</Link>
          </Button>
        </div>
      ) : null}
    </div>
  )
}

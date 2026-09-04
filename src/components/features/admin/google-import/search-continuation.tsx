'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export function SearchContinuation({ hasMore, isLoading, onLoadMore }: {
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => Promise<boolean>
}) {
  const [automatic, setAutomatic] = useState(false)
  useEffect(() => {
    if (!automatic || !hasMore || isLoading) return
    const timer = setTimeout(async () => {
      if (!await onLoadMore()) setAutomatic(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [automatic, hasMore, isLoading, onLoadMore])

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground" role="status">
        {hasMore
          ? 'Búsqueda parcial: quedan páginas, categorías o sectores por consultar.'
          : 'Consultas finalizadas. Google no garantiza devolver todos los locales visibles en Maps.'}
      </p>
      {hasMore && <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={isLoading || automatic} onClick={() => void onLoadMore()}>
          {isLoading ? 'Consultando Google…' : 'Cargar más resultados'}
        </Button>
        <Button variant="outline" onClick={() => setAutomatic((value) => !value)}>
          {automatic ? 'Pausar carga continua' : 'Continuar todas las categorías y sectores'}
        </Button>
      </div>}
      {hasMore && <p className="text-xs text-muted-foreground">
        La carga continua realiza más consultas a Google y puede aumentar el costo. Puedes pausarla y conservar los resultados.
      </p>}
    </div>
  )
}

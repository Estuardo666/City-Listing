'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

type DashboardErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    toast.error('No se pudo cargar el dashboard. Intenta nuevamente.')
    console.error(error)
  }, [error])

  return (
    <div className="pb-16 pt-8">
      <section className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Error en el dashboard</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ocurrió un problema al cargar esta sección.
          </p>
          <Button onClick={reset} className="mt-4 h-9">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
      </section>
    </div>
  )
}

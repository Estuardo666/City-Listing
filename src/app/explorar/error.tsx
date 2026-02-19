'use client'

import { useEffect } from 'react'

export default function ExplorarError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[ExplorarError]', error)
  }, [error])

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-lg font-semibold text-foreground">Error al cargar la página</p>
      <pre className="max-w-xl overflow-auto rounded-xl bg-secondary p-4 text-left text-xs text-muted-foreground">
        {error.message}
        {error.digest ? `\nDigest: ${error.digest}` : ''}
      </pre>
      <button
        type="button"
        onClick={reset}
        className="rounded-xl border border-border/60 px-4 py-2 text-sm font-medium hover:bg-accent"
      >
        Reintentar
      </button>
    </div>
  )
}

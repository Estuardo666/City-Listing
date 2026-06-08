import { Search, AlertCircle, ExternalLink } from 'lucide-react'
import { getSearchConsoleData, isSearchConsoleConfigured, type DateRangePreset } from '@/lib/queries/search-console'
import { SearchConsoleDashboard } from '@/components/features/admin/search-console/search-console-dashboard'

export const metadata = {
  title: 'Search Console — Admin',
  description: 'Metricas de Google Search Console para Vive Loja.',
}

type SearchConsolePageProps = {
  searchParams: Promise<{ range?: string; setup?: string; error?: string; refresh_token?: string }>
}

export default async function SearchConsolePage({ searchParams }: SearchConsolePageProps) {
  const params = await searchParams
  const range = (params.range || '28d') as DateRangePreset
  const setupSuccess = params.setup === 'success'
  const refreshToken = params.refresh_token
  const errorMsg = params.error

  if (!isSearchConsoleConfigured()) {
    return (
      <div className="min-h-screen bg-background pt-14">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-medium text-foreground">Search Console</h1>
            <p className="mt-2 text-muted-foreground">
              Metricas de Google Search Console
            </p>
          </div>

          {setupSuccess && refreshToken && (
            <div className="rounded-2xl border border-green-300 bg-green-50 p-6 mb-6">
              <h2 className="text-lg font-semibold text-green-800 mb-2">Autorizacion exitosa</h2>
              <p className="text-sm text-green-700 mb-3">
                Agrega esta variable de entorno a tu archivo <code className="rounded bg-green-100 px-1.5 py-0.5 font-mono">.env</code>:
              </p>
              <div className="rounded-lg bg-green-900 p-4 font-mono text-sm text-green-100 break-all">
                GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN=&quot;{refreshToken}&quot;
              </div>
              <p className="text-sm text-green-700 mt-3">
                Despues de guardar, reinicia el servidor para aplicar los cambios.
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 mb-6">
              <h2 className="text-lg font-semibold text-destructive mb-2">Error en la autorizacion</h2>
              <p className="text-sm text-muted-foreground">{errorMsg}</p>
            </div>
          )}

          <div className="rounded-2xl border border-border/60 bg-card p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Conectar con Google Search Console
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Autoriza el acceso a tu cuenta de Google Search Console para ver las metricas de rendimiento de busqueda.
            </p>

            <a
              href="/api/admin/search-console/setup"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Autorizar con Google
            </a>

            <div className="text-left max-w-lg mx-auto rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground mt-6">
              <p className="font-semibold text-foreground mb-2">Requisitos previos:</p>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Un proyecto en <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google Cloud Console</a> con la <strong>Search Console API</strong> habilitada</li>
                <li>Credenciales OAuth2 (Client ID y Secret) configuradas en <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">.env</code></li>
                <li>Tu cuenta de Google debe tener acceso a la propiedad en <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-primary underline">Search Console</a></li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    )
  }

  let data
  try {
    data = await getSearchConsoleData(range)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return (
      <div className="min-h-screen bg-background pt-14">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-medium text-foreground">Search Console</h1>
            <p className="mt-2 text-muted-foreground">
              Metricas de Google Search Console
            </p>
          </div>

          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Error al cargar datos</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">{message}</p>
            <a
              href="/api/admin/search-console/setup"
              className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
            >
              Reautorizar con Google
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-14">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Search className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-medium text-foreground">Search Console</h1>
              <p className="text-muted-foreground">
                Metricas de rendimiento en busqueda de Google &middot;{' '}
                {new Date(data.dateRange.startDate).toLocaleDateString('es-EC')} -{' '}
                {new Date(data.dateRange.endDate).toLocaleDateString('es-EC')}
              </p>
            </div>
          </div>
        </div>

        <SearchConsoleDashboard data={data} />
      </div>
    </div>
  )
}

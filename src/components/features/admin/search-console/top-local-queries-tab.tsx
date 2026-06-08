'use client'

import { MapPin } from 'lucide-react'
import type { TopLocalQuery } from '@/lib/seo/search-console-insights'

type TopLocalQueriesTabProps = {
  queries: TopLocalQuery[]
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toLocaleString()
}

function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    restaurantes: 'bg-orange-100 text-orange-700',
    cafeterias: 'bg-amber-100 text-amber-700',
    hoteles: 'bg-blue-100 text-blue-700',
    eventos: 'bg-purple-100 text-purple-700',
    farmacias: 'bg-green-100 text-green-700',
    bares: 'bg-pink-100 text-pink-700',
    gimnasios: 'bg-red-100 text-red-700',
    bancos: 'bg-emerald-100 text-emerald-700',
    tiendas: 'bg-cyan-100 text-cyan-700',
    general: 'bg-gray-100 text-gray-700',
  }
  return map[category] || 'bg-gray-100 text-gray-700'
}

export function TopLocalQueriesTab({ queries }: TopLocalQueriesTabProps) {
  const grouped = queries.reduce(
    (acc, q) => {
      if (!acc[q.category]) acc[q.category] = []
      acc[q.category].push(q)
      return acc
    },
    {} as Record<string, TopLocalQuery[]>,
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-green-500" />
        <h3 className="text-lg font-semibold text-foreground">Consultas Locales</h3>
      </div>

      {Object.keys(grouped).length > 0 ? (
        Object.entries(grouped).map(([category, categoryQueries]) => (
          <div key={category} className="rounded-2xl border border-border/60 bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getCategoryColor(category)}`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </span>
              <span className="text-xs text-muted-foreground">
                {categoryQueries.length} consultas
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="pb-2 text-left font-medium text-muted-foreground">Consulta</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">Clics</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">Imp.</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">CTR</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">Pos.</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryQueries.map((q, i) => (
                    <tr key={i} className="border-b border-border/20 last:border-0">
                      <td className="py-2.5 pr-4 text-foreground truncate max-w-[250px]">
                        {q.query}
                      </td>
                      <td className="py-2.5 text-right text-blue-600 font-medium">
                        {formatNumber(q.clicks)}
                      </td>
                      <td className="py-2.5 text-right text-muted-foreground">
                        {formatNumber(q.impressions)}
                      </td>
                      <td className="py-2.5 text-right text-muted-foreground">
                        {(q.ctr * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 text-right text-muted-foreground">{q.position}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      ) : (
        <div className="rounded-2xl border border-border/60 bg-card py-12 text-center">
          <MapPin className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">
            No se encontraron consultas locales. Sincroniza los datos primero.
          </p>
        </div>
      )}
    </div>
  )
}

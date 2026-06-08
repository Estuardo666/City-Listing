'use client'

import { Search } from 'lucide-react'
import type { SearchConsoleQuery } from '@/lib/queries/search-console'

type TopQueriesTableProps = {
  queries: SearchConsoleQuery[]
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toLocaleString()
}

export function TopQueriesTable({ queries }: TopQueriesTableProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Search className="h-5 w-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-foreground">Principales consultas</h3>
      </div>
      {queries.length > 0 ? (
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
              {queries.slice(0, 25).map((q, i) => (
                <tr key={i} className="border-b border-border/20 last:border-0">
                  <td className="py-2.5 pr-4 text-foreground truncate max-w-[200px]">{q.query}</td>
                  <td className="py-2.5 text-right text-blue-600 font-medium">{formatNumber(q.clicks)}</td>
                  <td className="py-2.5 text-right text-muted-foreground">{formatNumber(q.impressions)}</td>
                  <td className="py-2.5 text-right text-muted-foreground">{(q.ctr * 100).toFixed(1)}%</td>
                  <td className="py-2.5 text-right text-muted-foreground">{q.position}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">Sin datos de consultas</p>
      )}
    </div>
  )
}

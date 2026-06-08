'use client'

import { FileText } from 'lucide-react'
import type { SearchConsolePage } from '@/lib/queries/search-console'

type TopPagesTableProps = {
  pages: SearchConsolePage[]
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toLocaleString()
}

function shortenUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname
    if (path.length > 40) {
      return path.substring(0, 37) + '...'
    }
    return path || '/'
  } catch {
    return url
  }
}

export function TopPagesTable({ pages }: TopPagesTableProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-green-500" />
        <h3 className="text-lg font-semibold text-foreground">Principales paginas</h3>
      </div>
      {pages.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40">
                <th className="pb-2 text-left font-medium text-muted-foreground">Pagina</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Clics</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Imp.</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">CTR</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Pos.</th>
              </tr>
            </thead>
            <tbody>
              {pages.slice(0, 25).map((p, i) => (
                <tr key={i} className="border-b border-border/20 last:border-0">
                  <td className="py-2.5 pr-4 text-foreground truncate max-w-[250px]" title={p.page}>
                    {shortenUrl(p.page)}
                  </td>
                  <td className="py-2.5 text-right text-blue-600 font-medium">{formatNumber(p.clicks)}</td>
                  <td className="py-2.5 text-right text-muted-foreground">{formatNumber(p.impressions)}</td>
                  <td className="py-2.5 text-right text-muted-foreground">{(p.ctr * 100).toFixed(1)}%</td>
                  <td className="py-2.5 text-right text-muted-foreground">{p.position}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">Sin datos de paginas</p>
      )}
    </div>
  )
}

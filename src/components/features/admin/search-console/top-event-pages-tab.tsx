'use client'

import { CalendarDays, ExternalLink } from 'lucide-react'
import type { TopEventPage } from '@/lib/seo/search-console-insights'

type TopEventPagesTabProps = {
  pages: TopEventPage[]
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toLocaleString()
}

export function TopEventPagesTab({ pages }: TopEventPagesTabProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-foreground">Páginas de Eventos</h3>
        </div>
        <span className="text-xs text-muted-foreground">Páginas /eventos/*</span>
      </div>

      {pages.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40">
                <th className="pb-2 text-left font-medium text-muted-foreground">Evento</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Clics</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Imp.</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">CTR</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Pos.</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page, i) => (
                <tr key={i} className="border-b border-border/20 last:border-0">
                  <td className="py-2.5 pr-4">
                    <a
                      href={page.page}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-foreground hover:text-primary transition-colors truncate max-w-[250px]"
                    >
                      {page.name}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </td>
                  <td className="py-2.5 text-right text-blue-600 font-medium">
                    {formatNumber(page.clicks)}
                  </td>
                  <td className="py-2.5 text-right text-muted-foreground">
                    {formatNumber(page.impressions)}
                  </td>
                  <td className="py-2.5 text-right text-muted-foreground">
                    {(page.ctr * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 text-right text-muted-foreground">{page.position}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-12 text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">
            No hay datos de páginas de eventos. Sincroniza los datos primero.
          </p>
        </div>
      )}
    </div>
  )
}

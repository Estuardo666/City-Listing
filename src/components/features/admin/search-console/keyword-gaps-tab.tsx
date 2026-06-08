'use client'

import { Search, ExternalLink } from 'lucide-react'
import type { KeywordGap } from '@/lib/seo/search-console-insights'

type KeywordGapsTabProps = {
  gaps: KeywordGap[]
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toLocaleString()
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'bg-red-100 text-red-700'
  if (score >= 40) return 'bg-amber-100 text-amber-700'
  return 'bg-green-100 text-green-700'
}

function getRecLabel(rec: string): string {
  const map: Record<string, string> = {
    CREATE_LANDING: 'Crear Landing',
    OPTIMIZE_PAGE: 'Optimizar Página',
    CREATE_CATEGORY: 'Crear Categoría',
    CREATE_EVENT: 'Crear Evento',
    CREATE_ARTICLE: 'Crear Artículo',
  }
  return map[rec] || rec
}

export function KeywordGapsTab({ gaps }: KeywordGapsTabProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-foreground">Keyword Gaps</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          Keywords con impresiones &gt; 10 sin página optimizada
        </span>
      </div>

      {gaps.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40">
                <th className="pb-2 text-left font-medium text-muted-foreground">Keyword</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Imp.</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Clics</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">CTR</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Pos.</th>
                <th className="pb-2 text-center font-medium text-muted-foreground">Score</th>
                <th className="pb-2 text-left font-medium text-muted-foreground">Página</th>
                <th className="pb-2 text-left font-medium text-muted-foreground">Acción</th>
              </tr>
            </thead>
            <tbody>
              {gaps.map((gap, i) => (
                <tr key={i} className="border-b border-border/20 last:border-0">
                  <td className="py-2.5 pr-4 text-foreground truncate max-w-[200px]">
                    {gap.query}
                  </td>
                  <td className="py-2.5 text-right text-muted-foreground">
                    {formatNumber(gap.impressions)}
                  </td>
                  <td className="py-2.5 text-right text-blue-600 font-medium">
                    {formatNumber(gap.clicks)}
                  </td>
                  <td className="py-2.5 text-right text-muted-foreground">
                    {(gap.ctr * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 text-right text-muted-foreground">{gap.position}</td>
                  <td className="py-2.5 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getScoreColor(gap.score)}`}
                    >
                      {gap.score}
                    </span>
                  </td>
                  <td className="py-2.5">
                    {gap.relatedPage ? (
                      <a
                        href={gap.relatedPage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                      >
                        {gap.relatedPage}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-red-500">No existe</span>
                    )}
                  </td>
                  <td className="py-2.5">
                    <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-foreground">
                      {getRecLabel(gap.recommendation)}
                    </span>
                    {gap.suggestedUrl && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{gap.suggestedUrl}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-12 text-center">
          <Search className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">
            No se encontraron gaps de keywords. Sincroniza los datos primero.
          </p>
        </div>
      )}
    </div>
  )
}

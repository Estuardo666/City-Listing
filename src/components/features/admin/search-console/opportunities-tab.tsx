'use client'

import { Lightbulb, ExternalLink } from 'lucide-react'
import type { KeywordOpportunity } from '@/lib/seo/search-console-insights'

type OpportunitiesTabProps = {
  opportunities: KeywordOpportunity[]
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

function getRecommendationLabel(rec: string): string {
  const map: Record<string, string> = {
    'Optimizar título y meta description': 'Optimizar SEO',
    'Mejorar snippet': 'Mejorar snippet',
  }
  return map[rec] || rec
}

export function OpportunitiesTab({ opportunities }: OpportunitiesTabProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <h3 className="text-lg font-semibold text-foreground">Oportunidades SEO</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          Keywords con impresiones &gt; 20 y CTR &lt; 3%
        </span>
      </div>

      {opportunities.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40">
                <th className="pb-2 text-left font-medium text-muted-foreground">Keyword</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Clics</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Imp.</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">CTR</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Pos.</th>
                <th className="pb-2 text-center font-medium text-muted-foreground">Score</th>
                <th className="pb-2 text-left font-medium text-muted-foreground">Acción</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((opp, i) => (
                <tr key={i} className="border-b border-border/20 last:border-0">
                  <td className="py-2.5 pr-4 text-foreground truncate max-w-[250px]">
                    {opp.query}
                  </td>
                  <td className="py-2.5 text-right text-blue-600 font-medium">
                    {formatNumber(opp.clicks)}
                  </td>
                  <td className="py-2.5 text-right text-muted-foreground">
                    {formatNumber(opp.impressions)}
                  </td>
                  <td className="py-2.5 text-right text-red-500 font-medium">
                    {(opp.ctr * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 text-right text-muted-foreground">{opp.position}</td>
                  <td className="py-2.5 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getScoreColor(opp.score)}`}
                    >
                      {opp.score}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-foreground">
                      {getRecommendationLabel(opp.recommendation)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-12 text-center">
          <Lightbulb className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">
            No se encontraron oportunidades. Sincroniza los datos de Search Console primero.
          </p>
        </div>
      )}
    </div>
  )
}

'use client'

import { Zap, TrendingUp, TrendingDown, Plus, ArrowRight } from 'lucide-react'
import type { SearchConsoleInsightsData } from '@/lib/seo/search-console-insights'

type ActionsTabProps = {
  insights: SearchConsoleInsightsData
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toLocaleString()
}

function getRecAction(rec: string): { label: string; href: string; color: string } {
  const map: Record<string, { label: string; href: string; color: string }> = {
    CREATE_LANDING: {
      label: 'Crear Landing',
      href: '/admin/categorias',
      color: 'bg-green-100 text-green-700 hover:bg-green-200',
    },
    OPTIMIZE_PAGE: {
      label: 'Optimizar Página',
      href: '/admin/locales',
      color: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
    },
    CREATE_CATEGORY: {
      label: 'Crear Categoría',
      href: '/admin/categorias',
      color: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    },
    CREATE_EVENT: {
      label: 'Crear Evento',
      href: '/eventos/crear',
      color: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
    },
    CREATE_ARTICLE: {
      label: 'Crear Artículo',
      href: '/blog/crear',
      color: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200',
    },
  }
  return (
    map[rec] || {
      label: 'Ver',
      href: '/admin/search-console',
      color: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    }
  )
}

export function ActionsTab({ insights }: ActionsTabProps) {
  const topOpportunities = [...insights.keywordOpportunities]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)

  const topGaps = [...insights.keywordGaps].slice(0, 10)

  const trendingUp = insights.trends.filter((t) => t.growth > 0).slice(0, 5)
  const trendingDown = insights.trends.filter((t) => t.growth < 0).slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Oportunidades</p>
              <p className="mt-1 text-2xl font-medium text-foreground">
                {insights.totalOpportunities}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <Zap className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Keyword Gaps</p>
              <p className="mt-1 text-2xl font-medium text-foreground">{insights.totalGaps}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
              <Zap className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Keywords rastreadas</p>
              <p className="mt-1 text-2xl font-medium text-foreground">
                {formatNumber(insights.totalKeywords)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Actionable Opportunities */}
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-amber-500" />
          <h3 className="text-lg font-semibold text-foreground">Acciones Recomendadas</h3>
        </div>

        {topOpportunities.length > 0 ? (
          <div className="space-y-3">
            {topOpportunities.map((opp, i) => {
              const action = getRecAction(opp.recommendation)
              return (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-border/40 p-4 transition-colors hover:bg-accent/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground truncate">{opp.query}</span>
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        CTR {(opp.ctr * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatNumber(opp.impressions)} impresiones</span>
                      <span>Pos. {opp.position}</span>
                      <span>Score: {opp.score}</span>
                    </div>
                  </div>
                  <a
                    href={action.href}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${action.color}`}
                  >
                    {action.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay oportunidades detectadas. Sincroniza los datos de Search Console.
          </p>
        )}
      </div>

      {/* Keyword Gaps with Actions */}
      {topGaps.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="h-5 w-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-foreground">Crear Contenido Nuevo</h3>
          </div>
          <div className="space-y-3">
            {topGaps.map((gap, i) => {
              const action = getRecAction(gap.recommendation)
              return (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-border/40 p-4 transition-colors hover:bg-accent/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{gap.query}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatNumber(gap.impressions)} impresiones</span>
                      {gap.suggestedUrl && <span>URL: {gap.suggestedUrl}</span>}
                    </div>
                  </div>
                  <a
                    href={action.href}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${action.color}`}
                  >
                    {action.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Trending */}
      {(trendingUp.length > 0 || trendingDown.length > 0) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Trending Up */}
          {trendingUp.length > 0 && (
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-semibold text-foreground">En crecimiento</h3>
              </div>
              <div className="space-y-2">
                {trendingUp.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-border/40 p-3"
                  >
                    <span className="text-sm text-foreground truncate max-w-[200px]">
                      {t.query}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600">
                      <TrendingUp className="h-3.5 w-3.5" />
                      +{t.growth}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending Down */}
          {trendingDown.length > 0 && (
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="h-5 w-5 text-red-500" />
                <h3 className="text-lg font-semibold text-foreground">En descenso</h3>
              </div>
              <div className="space-y-2">
                {trendingDown.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-border/40 p-3"
                  >
                    <span className="text-sm text-foreground truncate max-w-[200px]">
                      {t.query}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-red-600">
                      <TrendingDown className="h-3.5 w-3.5" />
                      {t.growth}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

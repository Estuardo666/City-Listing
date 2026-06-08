'use client'

import { FileText, Newspaper, Tag, CalendarDays, FolderTree } from 'lucide-react'
import type { ContentIdea } from '@/lib/seo/search-console-insights'

type ContentIdeasTabProps = {
  ideas: ContentIdea[]
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toLocaleString()
}

function getTypeIcon(type: ContentIdea['type']) {
  switch (type) {
    case 'ARTICLE':
      return Newspaper
    case 'LANDING':
      return Tag
    case 'EVENT':
      return CalendarDays
    case 'CATEGORY':
      return FolderTree
    default:
      return FileText
  }
}

function getTypeLabel(type: ContentIdea['type']): string {
  const map: Record<string, string> = {
    ARTICLE: 'Artículo',
    LANDING: 'Landing',
    EVENT: 'Evento',
    CATEGORY: 'Categoría',
  }
  return map[type] || type
}

function getTypeColor(type: ContentIdea['type']): string {
  const map: Record<string, string> = {
    ARTICLE: 'bg-blue-100 text-blue-700',
    LANDING: 'bg-green-100 text-green-700',
    EVENT: 'bg-purple-100 text-purple-700',
    CATEGORY: 'bg-amber-100 text-amber-700',
  }
  return map[type] || 'bg-gray-100 text-gray-700'
}

export function ContentIdeasTab({ ideas }: ContentIdeasTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-semibold text-foreground">Ideas de Contenido</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          Generadas automáticamente desde Search Console
        </span>
      </div>

      {ideas.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea, i) => {
            const Icon = getTypeIcon(idea.type)
            return (
              <div
                key={i}
                className="rounded-2xl border border-border/60 bg-card p-5 space-y-3 transition-colors hover:border-border"
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeColor(idea.type)}`}
                  >
                    <Icon className="h-3 w-3" />
                    {getTypeLabel(idea.type)}
                  </span>
                  {idea.impressions > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {formatNumber(idea.impressions)} imp.
                    </span>
                  )}
                </div>
                <h4 className="font-medium text-foreground leading-snug">{idea.title}</h4>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Keyword:</span> {idea.sourceKeyword}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">URL:</span> {idea.suggestedUrl}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 bg-card py-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">
            No hay ideas de contenido disponibles. Sincroniza los datos primero.
          </p>
        </div>
      )}
    </div>
  )
}

'use client'

import { Heart, MessageCircle, Eye, TrendingUp } from 'lucide-react'
import type { EngagementStats } from '@/lib/queries/engagement'

type EngagementStatsProps = {
  stats: EngagementStats
}

export function EngagementStatsWidget({ stats }: EngagementStatsProps) {
  const hasAny =
    stats.totalFavorites > 0 || stats.totalComments > 0 || stats.totalViews > 0

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Engagement</h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Favorites */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-center gap-2 text-rose-700">
            <Heart className="h-4 w-4" />
            <span className="text-xs font-medium">Favoritos</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-900">{stats.totalFavorites}</p>
          <div className="mt-1 space-y-0.5">
            {stats.eventFavorites > 0 && (
              <p className="text-[10px] text-rose-600">{stats.eventFavorites} en eventos</p>
            )}
            {stats.venueFavorites > 0 && (
              <p className="text-[10px] text-rose-600">{stats.venueFavorites} en locales</p>
            )}
            {stats.postFavorites > 0 && (
              <p className="text-[10px] text-rose-600">{stats.postFavorites} en artículos</p>
            )}
            {stats.totalFavorites === 0 && (
              <p className="text-[10px] text-rose-400">Sin favoritos aún</p>
            )}
          </div>
        </div>

        {/* Comments */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2 text-blue-700">
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs font-medium">Comentarios</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-900">{stats.totalComments}</p>
          <div className="mt-1 space-y-0.5">
            {stats.eventComments > 0 && (
              <p className="text-[10px] text-blue-600">{stats.eventComments} en eventos</p>
            )}
            {stats.venueComments > 0 && (
              <p className="text-[10px] text-blue-600">{stats.venueComments} en locales</p>
            )}
            {stats.postComments > 0 && (
              <p className="text-[10px] text-blue-600">{stats.postComments} en artículos</p>
            )}
            {stats.totalComments === 0 && (
              <p className="text-[10px] text-blue-400">Sin comentarios aún</p>
            )}
          </div>
        </div>

        {/* Views */}
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
          <div className="flex items-center gap-2 text-violet-700">
            <Eye className="h-4 w-4" />
            <span className="text-xs font-medium">Vistas</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-violet-900">{stats.totalViews}</p>
          <div className="mt-1">
            {stats.postViews > 0 ? (
              <p className="text-[10px] text-violet-600">{stats.postViews} en artículos</p>
            ) : (
              <p className="text-[10px] text-violet-400">Sin vistas aún</p>
            )}
          </div>
        </div>
      </div>

      {!hasAny && (
        <p className="text-center text-xs text-muted-foreground">
          Las estadísticas aparecerán cuando tu contenido reciba interacciones.
        </p>
      )}
    </div>
  )
}

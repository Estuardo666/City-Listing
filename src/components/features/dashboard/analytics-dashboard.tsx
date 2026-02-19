import Link from 'next/link'
import {
  Calendar,
  Eye,
  FileText,
  Heart,
  MapPin,
  MessageCircle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import type { AuthorAnalytics } from '@/lib/queries/analytics'
import { AnalyticsCharts } from '@/components/features/dashboard/analytics-charts'

type AnalyticsDashboardProps = {
  analytics: AuthorAnalytics
}

export function AnalyticsDashboard({ analytics }: AnalyticsDashboardProps) {
  const totalContent = analytics.posts.total + analytics.events.total + analytics.venues.total
  const totalEngagement = analytics.posts.totalFavorites + analytics.events.totalFavorites + analytics.venues.totalFavorites

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Contenido</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{totalContent}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Vistas</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{analytics.posts.totalViews.toLocaleString()}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <Eye className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Favoritos</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{totalEngagement}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <Heart className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Comentarios</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{analytics.posts.totalComments}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
              <MessageCircle className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Type Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-foreground">Posts</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Publicados</span>
              <span className="font-medium text-green-600">{analytics.posts.published}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pendientes</span>
              <span className="font-medium text-amber-600">{analytics.posts.pending}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rechazados</span>
              <span className="font-medium text-red-600">{analytics.posts.rejected}</span>
            </div>
            <div className="pt-2 border-t border-border/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vistas</span>
                <span className="font-medium">{analytics.posts.totalViews.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Favoritos</span>
                <span className="font-medium">{analytics.posts.totalFavorites}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Comentarios</span>
                <span className="font-medium">{analytics.posts.totalComments}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-green-500" />
            <h3 className="text-lg font-semibold text-foreground">Eventos</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Aprobados</span>
              <span className="font-medium text-green-600">{analytics.events.approved}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pendientes</span>
              <span className="font-medium text-amber-600">{analytics.events.pending}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rechazados</span>
              <span className="font-medium text-red-600">{analytics.events.rejected}</span>
            </div>
            <div className="pt-2 border-t border-border/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Favoritos</span>
                <span className="font-medium">{analytics.events.totalFavorites}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-foreground">Locales</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Aprobados</span>
              <span className="font-medium text-green-600">{analytics.venues.approved}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pendientes</span>
              <span className="font-medium text-amber-600">{analytics.venues.pending}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rechazados</span>
              <span className="font-medium text-red-600">{analytics.venues.rejected}</span>
            </div>
            <div className="pt-2 border-t border-border/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Favoritos</span>
                <span className="font-medium">{analytics.venues.totalFavorites}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Performing Posts */}
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <h3 className="text-lg font-semibold text-foreground">Mejor Rendimiento</h3>
          </div>
          {analytics.topPosts.length > 0 ? (
            <div className="space-y-3">
              {analytics.topPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="block p-3 rounded-lg border border-border/40 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post.viewCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {post.favoriteCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {post.commentCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Sin datos disponibles</p>
          )}
        </div>

        {/* Low Performing Posts */}
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-semibold text-foreground">Menor Rendimiento</h3>
          </div>
          {analytics.lowPerformingPosts.length > 0 ? (
            <div className="space-y-3">
              {analytics.lowPerformingPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/dashboard/blog/${post.id}/editar`}
                  className="block p-3 rounded-lg border border-border/40 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post.viewCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {post.favoriteCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {post.commentCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Sin datos disponibles</p>
          )}
        </div>
      </div>

      {/* Visual charts */}
      <AnalyticsCharts analytics={analytics} />
    </div>
  )
}

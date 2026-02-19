'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
} from 'recharts'
import type { AuthorAnalytics } from '@/lib/queries/analytics'

type AnalyticsChartsProps = {
  analytics: AuthorAnalytics
}

export function AnalyticsCharts({ analytics }: AnalyticsChartsProps) {
  const contentBreakdownData = [
    {
      name: 'Posts',
      total: analytics.posts.total,
      approved: analytics.posts.published,
      pending: analytics.posts.pending,
      rejected: analytics.posts.rejected,
    },
    {
      name: 'Eventos',
      total: analytics.events.total,
      approved: analytics.events.approved,
      pending: analytics.events.pending,
      rejected: analytics.events.rejected,
    },
    {
      name: 'Locales',
      total: analytics.venues.total,
      approved: analytics.venues.approved,
      pending: analytics.venues.pending,
      rejected: analytics.venues.rejected,
    },
  ]

  const engagementTrendData = [
    { name: 'Vistas', value: analytics.posts.totalViews },
    { name: 'Favoritos', value: analytics.posts.totalFavorites + analytics.events.totalFavorites + analytics.venues.totalFavorites },
    { name: 'Comentarios', value: analytics.posts.totalComments },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <h3 className="mb-4 text-base font-semibold text-foreground">Estado por tipo de contenido</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={contentBreakdownData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="approved" name="Aprobados" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" name="Pendientes" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rejected" name="Rechazados" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <h3 className="mb-4 text-base font-semibold text-foreground">Engagement total</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={engagementTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="value" name="Total" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

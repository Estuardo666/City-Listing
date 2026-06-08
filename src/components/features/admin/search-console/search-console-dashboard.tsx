'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import {
  MousePointerClick,
  Eye,
  Percent,
  MapPin,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  FileText,
} from 'lucide-react'
import type { SearchConsoleData, DateRangePreset } from '@/lib/queries/search-console'
import { TopQueriesTable } from '@/components/features/admin/search-console/top-queries-table'
import { TopPagesTable } from '@/components/features/admin/search-console/top-pages-table'

const SearchConsoleCharts = dynamic(
  () => import('@/components/features/admin/search-console/search-console-charts').then((mod) => mod.SearchConsoleCharts),
  { ssr: false, loading: () => <div className="h-[300px] animate-pulse rounded-lg bg-muted" /> }
)

type SearchConsoleDashboardProps = {
  data: SearchConsoleData
}

const DATE_RANGE_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: '7d', label: 'Últimos 7 días' },
  { value: '28d', label: 'Últimos 28 días' },
  { value: '3m', label: 'Últimos 3 meses' },
  { value: '6m', label: 'Últimos 6 meses' },
  { value: '12m', label: 'Últimos 12 meses' },
]

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toLocaleString()
}

function getDeviceIcon(device: string) {
  switch (device) {
    case 'Escritorio':
      return Monitor
    case 'Móvil':
      return Smartphone
    case 'Tablet':
      return Tablet
    default:
      return Monitor
  }
}

export function SearchConsoleDashboard({ data }: SearchConsoleDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRangePreset>('28d')

  function handleDateRangeChange(preset: DateRangePreset) {
    setDateRange(preset)
    const params = new URLSearchParams(window.location.search)
    params.set('range', preset)
    window.location.search = params.toString()
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center gap-2">
        {DATE_RANGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => handleDateRangeChange(option.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              dateRange === option.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Clics totales</p>
              <p className="mt-1 text-2xl font-medium text-foreground">
                {formatNumber(data.summary.totalClicks)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <MousePointerClick className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Impresiones</p>
              <p className="mt-1 text-2xl font-medium text-foreground">
                {formatNumber(data.summary.totalImpressions)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <Eye className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">CTR promedio</p>
              <p className="mt-1 text-2xl font-medium text-foreground">
                {(data.summary.averageCtr * 100).toFixed(1)}%
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
              <Percent className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Posición promedio</p>
              <p className="mt-1 text-2xl font-medium text-foreground">
                {data.summary.averagePosition.toFixed(1)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
              <MapPin className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Time Series Charts */}
      <SearchConsoleCharts data={data} />

      {/* Devices & Countries */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Devices */}
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-foreground">Dispositivos</h3>
          </div>
          {data.devices.length > 0 ? (
            <div className="space-y-3">
              {data.devices.map((d) => {
                const Icon = getDeviceIcon(d.device)
                return (
                  <div key={d.device} className="flex items-center justify-between p-3 rounded-lg border border-border/40">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{d.device}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{formatNumber(d.clicks)} clics</span>
                      <span>{formatNumber(d.impressions)} imp.</span>
                      <span>{(d.ctr * 100).toFixed(1)}% CTR</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Sin datos de dispositivos</p>
          )}
        </div>

        {/* Countries */}
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-green-500" />
            <h3 className="text-lg font-semibold text-foreground">Países</h3>
          </div>
          {data.countries.length > 0 ? (
            <div className="space-y-3">
              {data.countries.slice(0, 10).map((c) => (
                <div key={c.country} className="flex items-center justify-between p-3 rounded-lg border border-border/40">
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{c.country}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{formatNumber(c.clicks)} clics</span>
                    <span>{formatNumber(c.impressions)} imp.</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Sin datos de países</p>
          )}
        </div>
      </div>

      {/* Top Queries & Pages */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopQueriesTable queries={data.topQueries} />
        <TopPagesTable pages={data.topPages} />
      </div>

      {/* Sitemaps */}
      {data.sitemaps.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-indigo-500" />
            <h3 className="text-lg font-semibold text-foreground">Sitemaps</h3>
          </div>
          <div className="space-y-3">
            {data.sitemaps.map((sitemap) => (
              <div key={sitemap.path} className="flex items-center justify-between p-3 rounded-lg border border-border/40">
                <div>
                  <p className="text-sm font-medium text-foreground">{sitemap.path}</p>
                  <p className="text-xs text-muted-foreground">
                    {sitemap.type} &middot;{' '}
                    {sitemap.lastSubmitted
                      ? `Enviado: ${new Date(sitemap.lastSubmitted).toLocaleDateString('es-EC')}`
                      : 'No enviado'}
                  </p>
                </div>
                {sitemap.isPending && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                    Pendiente
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

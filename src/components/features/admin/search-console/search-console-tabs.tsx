'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart3,
  Lightbulb,
  Search,
  FileText,
  MapPin,
  CalendarDays,
  Newspaper,
  Zap,
  TrendingUp,
} from 'lucide-react'
import type { SearchConsoleInsightsData } from '@/lib/seo/search-console-insights'
import type { SearchConsoleData, DateRangePreset } from '@/lib/queries/search-console'
import { SearchConsoleDashboard } from './search-console-dashboard'
import { OpportunitiesTab } from './opportunities-tab'
import { KeywordGapsTab } from './keyword-gaps-tab'
import { ContentIdeasTab } from './content-ideas-tab'
import { TopLocalQueriesTab } from './top-local-queries-tab'
import { TopBusinessPagesTab } from './top-business-pages-tab'
import { TopEventPagesTab } from './top-event-pages-tab'
import { TopBlogPagesTab } from './top-blog-pages-tab'
import { ActionsTab } from './actions-tab'

type Tab =
  | 'overview'
  | 'opportunities'
  | 'keyword-gaps'
  | 'content-ideas'
  | 'top-local'
  | 'top-venues'
  | 'top-events'
  | 'top-blog'
  | 'actions'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'opportunities', label: 'SEO Opportunities', icon: Lightbulb },
  { id: 'keyword-gaps', label: 'Keyword Gaps', icon: Search },
  { id: 'content-ideas', label: 'Content Ideas', icon: FileText },
  { id: 'top-local', label: 'Top Local Queries', icon: MapPin },
  { id: 'top-venues', label: 'Top Business Pages', icon: MapPin },
  { id: 'top-events', label: 'Top Event Pages', icon: CalendarDays },
  { id: 'top-blog', label: 'Top Blog Pages', icon: Newspaper },
  { id: 'actions', label: 'Actions', icon: Zap },
]

type SearchConsoleTabsProps = {
  overviewData: SearchConsoleData
  insightsData: SearchConsoleInsightsData
}

export function SearchConsoleTabs({ overviewData, insightsData }: SearchConsoleTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab') as Tab | null
    if (tab && TABS.some((t) => t.id === tab)) {
      setActiveTab(tab)
    }
  }, [])

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab)
    const params = new URLSearchParams(window.location.search)
    params.set('tab', tab)
    window.history.replaceState(null, '', `?${params.toString()}`)
  }, [])

  const handleSync = useCallback(async () => {
    setSyncing(true)
    setSyncMessage(null)
    try {
      const response = await fetch('/api/admin/search-console/sync', { method: 'POST' })
      const result = await response.json()
      if (result.success) {
        setSyncMessage(result.message)
        window.location.reload()
      } else {
        setSyncMessage(result.error || 'Error al sincronizar')
      }
    } catch {
      setSyncMessage('Error de conexión')
    } finally {
      setSyncing(false)
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border/60 bg-card p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Sync Bar */}
      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">Datos de Search Console</p>
            {insightsData.lastSyncDate && (
              <p className="text-xs text-muted-foreground">
                Última sincronización:{' '}
                {new Date(insightsData.lastSyncDate).toLocaleDateString('es-EC')}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {syncMessage && (
            <span className="text-xs text-muted-foreground">{syncMessage}</span>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {syncing ? 'Sincronizando...' : 'Sincronizar datos'}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <SearchConsoleDashboard data={overviewData} />}
      {activeTab === 'opportunities' && (
        <OpportunitiesTab opportunities={insightsData.keywordOpportunities} />
      )}
      {activeTab === 'keyword-gaps' && <KeywordGapsTab gaps={insightsData.keywordGaps} />}
      {activeTab === 'content-ideas' && <ContentIdeasTab ideas={insightsData.contentIdeas} />}
      {activeTab === 'top-local' && <TopLocalQueriesTab queries={insightsData.topLocalQueries} />}
      {activeTab === 'top-venues' && <TopBusinessPagesTab pages={insightsData.topVenuePages} />}
      {activeTab === 'top-events' && <TopEventPagesTab pages={insightsData.topEventPages} />}
      {activeTab === 'top-blog' && <TopBlogPagesTab pages={insightsData.topBlogPages} />}
      {activeTab === 'actions' && <ActionsTab insights={insightsData} />}
    </div>
  )
}

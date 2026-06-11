'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, FileText, CheckCircle, Cpu, Clock } from 'lucide-react'
import { getAIStatsAction } from '@/actions/ai/config'

export function AIDashboard() {
  const [stats, setStats] = useState<{
    totalProcessed: number
    totalConfirmed: number
    totalTokens: number
    avgProcessingTime: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAIStatsAction().then((res) => {
      if (res.success && res.data) setStats(res.data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!stats) return null

  const metrics = [
    {
      label: 'Flyers Procesados',
      value: stats.totalProcessed,
      icon: FileText,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      label: 'Eventos Confirmados',
      value: stats.totalConfirmed,
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-950/30',
    },
    {
      label: 'Tokens Consumidos',
      value: stats.totalTokens.toLocaleString(),
      icon: Cpu,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
    },
    {
      label: 'Tiempo Promedio',
      value: `${stats.avgProcessingTime}ms`,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((m) => (
        <Card key={m.label}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${m.bg}`}>
                <m.icon className={`h-5 w-5 ${m.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{m.label}</p>
                <p className="text-2xl font-bold">{m.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

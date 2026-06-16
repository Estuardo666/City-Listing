'use client'

import { useState, useEffect, useCallback } from 'react'
import { Star, RefreshCw, Loader2, CheckCircle, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ReputationStats {
  totalApproved: number
  withScore: number
  withoutScore: number
  avgScore: number
}

export function ReputationDashboard() {
  const [stats, setStats] = useState<ReputationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [recalculating, setRecalculating] = useState(false)
  const [result, setResult] = useState<{ processed: number; elapsed: number } | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/reputation/recalculate')
      if (!res.ok) return
      const data = await res.json()
      setStats(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const handleRecalculate = async () => {
    setRecalculating(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin/reputation/recalculate', { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al recalcular')
      }

      const data = await res.json()
      setResult({ processed: data.processed, elapsed: data.elapsed })
      toast.success(`${data.processed} reputaciones recalculadas en ${(data.elapsed / 1000).toFixed(1)}s`)
      fetchStats()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al recalcular')
    } finally {
      setRecalculating(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 bg-blue-50">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-muted-foreground">Total aprobados</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.totalApproved}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 bg-green-50">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-xs text-muted-foreground">Con score</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.withScore}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 bg-yellow-50">
              <div className="flex items-center gap-2 mb-1">
                <Star className="h-4 w-4 text-yellow-600" />
                <span className="text-xs text-muted-foreground">Sin score</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{stats.withoutScore}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 bg-purple-50">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                <span className="text-xs text-muted-foreground">Promedio</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{stats.avgScore.toFixed(1)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Recalcular reputación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Recalcula el score de reputación de todos los negocios aprobados. El score se basa en:
            rating efectivo (ViveLoja si ≥5 reseñas, sino Google), reseñas, visitas, favoritos,
            check-ins y completitud del perfil.
          </p>

          <div className="flex items-center gap-3">
            <Button onClick={handleRecalculate} disabled={recalculating}>
              {recalculating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Recalculando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recalcular reputación
                </>
              )}
            </Button>
          </div>

          {result && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              {result.processed} negocios recalculados en {(result.elapsed / 1000).toFixed(1)} segundos
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

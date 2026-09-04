'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

type MissingVenue = {
  id: string
  name: string
  slug: string
  googlePlaceId: string | null
  hoursLastSync: string | null
  reason: 'missing' | 'broken'
  canSyncWithGoogle: boolean
  hours: { dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }[]
}

type MissingHoursResponse = {
  total: number
  withoutAnyHours: number
  withBrokenHours: number
  venues: MissingVenue[]
  pageInfo: { skip: number; take: number; hasMore: boolean; nextSkip: number }
}

const TAKE = 50

export function MissingHoursPanel() {
  const [data, setData] = useState<MissingHoursResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [messages, setMessages] = useState<Record<string, string>>({})

  const load = useCallback(async (skip = 0) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/venues/missing-hours?take=${TAKE}&skip=${skip}`)
      if (!res.ok) throw new Error('No se pudo cargar la lista')
      setData(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(0)
  }, [load])

  async function syncVenue(venue: MissingVenue) {
    setSyncing(venue.id)
    setMessages((prev) => ({ ...prev, [venue.id]: '' }))
    try {
      const res = await fetch(`/api/admin/venues/${venue.id}/sync-hours`, { method: 'POST' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'No se pudo sincronizar')
      setMessages((prev) => ({ ...prev, [venue.id]: `Sincronizado: ${body.hoursCount} franjas` }))
      await load(data?.pageInfo.skip ?? 0)
    } catch (e) {
      setMessages((prev) => ({ ...prev, [venue.id]: e instanceof Error ? e.message : 'Error' }))
    } finally {
      setSyncing(null)
    }
  }

  if (loading && !data) return <p className="text-sm text-muted-foreground">Cargando…</p>
  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Total afectados" value={data.total} />
        <Stat label="Sin horarios" value={data.withoutAnyHours} />
        <Stat label="Horarios inservibles" value={data.withBrokenHours} />
      </div>

      {data.venues.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todos los locales aprobados tienen horarios utilizables.</p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {data.venues.map((venue) => (
            <li key={venue.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <Link href={`/locales/${venue.slug}`} className="font-medium hover:underline">
                  {venue.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {venue.reason === 'missing' ? 'Sin horarios cargados' : 'Horarios con formato invalido'}
                  {venue.hoursLastSync && ` · ultima sync ${new Date(venue.hoursLastSync).toLocaleDateString('es-EC')}`}
                </p>
                {messages[venue.id] && <p className="mt-1 text-xs text-muted-foreground">{messages[venue.id]}</p>}
              </div>
              <Link
                href={`/dashboard/locales/${venue.slug}/horarios`}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium"
              >
                Editar a mano
              </Link>
              <button
                type="button"
                disabled={!venue.canSyncWithGoogle || syncing === venue.id}
                onClick={() => syncVenue(venue)}
                className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background disabled:opacity-40"
                title={venue.canSyncWithGoogle ? 'Traer horarios de Google Places' : 'Sin googlePlaceId'}
              >
                {syncing === venue.id ? 'Sincronizando…' : 'Sincronizar con Google'}
              </button>
            </li>
          ))}
        </ul>
      )}

      {data.pageInfo.hasMore && (
        <button
          type="button"
          onClick={() => load(data.pageInfo.nextSkip)}
          className="rounded-lg border px-4 py-2 text-sm"
          disabled={loading}
        >
          {loading ? 'Cargando…' : 'Cargar más'}
        </button>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-2xl font-medium">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

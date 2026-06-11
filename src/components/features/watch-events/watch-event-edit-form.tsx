'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Loader2, Save, ArrowLeft, Trash2 } from 'lucide-react'
import { updateWatchEventAction, deleteWatchEventAction } from '@/actions/watch-events'
import { prisma } from '@/lib/prisma'

interface WatchEventEditFormProps {
  event: {
    id: string
    name: string
    slug: string
    type: string
    description: string | null
    image: string | null
    matchDate: Date
    matchTime: string | null
    competition: string | null
    status: string
    featured: boolean
    performers: string | null
    venues: Array<{
      id: string
      venueId: string
      flyerUrl: string | null
      promotion: string | null
      hasBigScreen: boolean
      hasFreeEntry: boolean
      venue: { id: string; name: string; slug: string }
    }>
  }
  allVenues: Array<{ id: string; name: string; slug: string }>
}

export function WatchEventEditForm({ event, allVenues }: WatchEventEditFormProps) {
  const router = useRouter()
  const [saving, startSave] = useTransition()
  const [deleting, startDelete] = useTransition()

  const [name, setName] = useState(event.name)
  const [type, setType] = useState(event.type)
  const [description, setDescription] = useState(event.description || '')
  const [matchDate, setMatchDate] = useState(new Date(event.matchDate).toISOString().split('T')[0])
  const [matchTime, setMatchTime] = useState(event.matchTime || '')
  const [competition, setCompetition] = useState(event.competition || '')
  const [image, setImage] = useState(event.image || '')
  const [status, setStatus] = useState(event.status)
  const [featured, setFeatured] = useState(event.featured)
  const [selectedVenueIds, setSelectedVenueIds] = useState<string[]>(
    event.venues.map((v) => v.venueId)
  )
  const [performerInput, setPerformerInput] = useState('')
  const [performers, setPerformers] = useState<string[]>(() => {
    try { return JSON.parse(event.performers || '[]') } catch { return [] }
  })

  function addPerformer() {
    const p = performerInput.trim()
    if (p && !performers.includes(p)) {
      setPerformers([...performers, p])
      setPerformerInput('')
    }
  }

  function removePerformer(name: string) {
    setPerformers(performers.filter((p) => p !== name))
  }

  function toggleVenue(id: string) {
    setSelectedVenueIds((ids) =>
      ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]
    )
  }

  function handleSave() {
    startSave(async () => {
      const res = await updateWatchEventAction(event.id, {
        name,
        type,
        description: description || undefined,
        matchDate,
        matchTime: matchTime || undefined,
        competition: competition || undefined,
        image: image || undefined,
        status,
        featured,
        venueIds: selectedVenueIds,
        performerNames: performers,
      })
      if (res.success) {
        toast.success('Evento actualizado')
        router.push('/admin/transmisiones')
      } else {
        toast.error(res.error || 'Error actualizando')
      }
    })
  }

  function handleDelete() {
    if (!confirm(`¿Eliminar "${event.name}"?`)) return
    startDelete(async () => {
      const res = await deleteWatchEventAction(event.id)
      if (res.success) {
        toast.success('Evento eliminado')
        router.push('/admin/transmisiones')
      } else {
        toast.error(res.error || 'Error eliminando')
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información del Evento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SPORTS">Deportes</SelectItem>
                  <SelectItem value="CONCERT">Concierto</SelectItem>
                  <SelectItem value="THEATER">Teatro</SelectItem>
                  <SelectItem value="ESPORTS">eSports</SelectItem>
                  <SelectItem value="OTHER">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input type="time" value={matchTime} onChange={(e) => setMatchTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Competición</Label>
              <Input value={competition} onChange={(e) => setCompetition(e.target.value)} placeholder="LigaPro, Champions, etc." />
            </div>
          </div>

          <div className="space-y-2">
            <Label>URL Imagen</Label>
            <Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Activo</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                  <SelectItem value="FINISHED">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={featured} onCheckedChange={setFeatured} />
              <Label>Destacado</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Participantes</CardTitle>
          <CardDescription>Equipos, artistas o participantes del evento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Nombre del participante..."
              value={performerInput}
              onChange={(e) => setPerformerInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPerformer())}
            />
            <Button type="button" variant="outline" onClick={addPerformer}>Agregar</Button>
          </div>
          {performers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {performers.map((p) => (
                <span key={p} className="flex items-center gap-1 bg-secondary rounded-lg px-3 py-1 text-sm">
                  {p}
                  <button onClick={() => removePerformer(p)} className="text-muted-foreground hover:text-foreground">×</button>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Negocios Participantes</CardTitle>
          <CardDescription>Selecciona los negocios que transmitirán este evento.</CardDescription>
        </CardHeader>
        <CardContent>
          {allVenues.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay negocios disponibles.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allVenues.map((v) => (
                <button
                  key={v.id}
                  onClick={() => toggleVenue(v.id)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm border transition-colors ${
                    selectedVenueIds.includes(v.id)
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-background border-border hover:border-primary/50'
                  }`}
                >
                  {selectedVenueIds.includes(v.id) ? '✓' : '○'} {v.name}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
          {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
          Eliminar evento
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/transmisiones')}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  )
}

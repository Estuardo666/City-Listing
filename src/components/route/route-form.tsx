'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createRouteAction } from '@/actions/routes'
import { routeSchema, type RouteInput } from '@/schemas/route.schema'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const ROUTE_TYPES = [
  { value: 'gastronomic', label: 'Gastronómica' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'adventure', label: 'Aventura' },
  { value: 'nightlife', label: 'Vida nocturna' },
  { value: 'nature', label: 'Naturaleza' },
]

interface RouteFormProps {
  venues: { id: string; name: string; slug: string }[]
}

export function RouteForm({ venues }: RouteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stops, setStops] = useState<
    { venueId: string | null; title: string; notes: string; duration: string; day: number; startTime: string }[]
  >([])

  const form = useForm<RouteInput>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      title: '',
      description: '',
      content: null,
      image: null,
      duration: null,
      difficulty: null,
      type: 'gastronomic',
      featured: false,
      days: 1,
    },
  })

  // Days come from the stops, so adding a stop on day 3 extends the itinerary
  // without a separate control to keep in sync.
  const dayCount = Math.max(1, ...stops.map((stop) => stop.day))

  function addStop(day = 1) {
    setStops((prev) => [...prev, { venueId: null, title: '', notes: '', duration: '', day, startTime: '' }])
  }

  function removeStop(index: number) {
    setStops((prev) => prev.filter((_, i) => i !== index))
  }

  function updateStop(index: number, field: string, value: string | number) {
    setStops((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value || null }
      return updated
    })
  }

  async function onSubmit(data: RouteInput) {
    setIsSubmitting(true)
    try {
      // `order` restarts on each day: the unique key is (routeId, day, order).
      const orderByDay = new Map<number, number>()
      const stopsData = stops.map((stop, i) => {
        const day = stop.day || 1
        const order = orderByDay.get(day) ?? 0
        orderByDay.set(day, order + 1)
        return {
          venueId: stop.venueId || null,
          title: stop.title || `Parada ${i + 1}`,
          notes: stop.notes || null,
          duration: stop.duration || null,
          day,
          order,
          startTime: stop.startTime || null,
        }
      })

      const result = await createRouteAction({ ...data, days: dayCount }, stopsData)

      if (result.success) {
        toast.success('Ruta creada correctamente')
        window.location.href = '/rutas'
      } else {
        toast.error(result.error ?? 'Error al crear la ruta')
      }
    } catch {
      toast.error('Error al crear la ruta')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Nombre de la ruta</FormLabel>
              <FormControl><Input placeholder="Ej: Ruta gastronómica del centro" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="type" render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de ruta</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {ROUTE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="duration" render={({ field }) => (
            <FormItem>
              <FormLabel>Duración estimada</FormLabel>
              <FormControl><Input placeholder="Ej: 2 horas" value={field.value ?? ''} onChange={field.onChange} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="difficulty" render={({ field }) => (
            <FormItem>
              <FormLabel>Dificultad</FormLabel>
              <Select onValueChange={(v) => field.onChange(v === 'none' ? null : v)} defaultValue={field.value ?? 'none'}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="none">No especificar</SelectItem>
                  <SelectItem value="Fácil">Fácil</SelectItem>
                  <SelectItem value="Moderado">Moderado</SelectItem>
                  <SelectItem value="Difícil">Difícil</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="image" render={({ field }) => (
            <FormItem>
              <FormLabel>Imagen (URL)</FormLabel>
              <FormControl><Input placeholder="https://..." value={field.value ?? ''} onChange={field.onChange} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Descripción</FormLabel>
              <FormControl><Textarea placeholder="Describe la ruta..." {...field} rows={3} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Stops */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Paradas de la ruta</h3>
              <p className="text-xs text-muted-foreground">
                {dayCount > 1 ? `Itinerario de ${dayCount} días` : 'Itinerario de un día'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => addStop(dayCount)}>
                Agregar parada
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => addStop(dayCount + 1)}>
                Agregar día
              </Button>
            </div>
          </div>
          {stops.map((stop, index) => (
            <div key={index} className="grid grid-cols-1 gap-3 rounded-xl border border-border/50 p-4 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">{index + 1}</span>
                <Select value={stop.venueId ?? 'custom'} onValueChange={(v) => updateStop(index, 'venueId', v === 'custom' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar local" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Parada personalizada</SelectItem>
                    {venues.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Input placeholder="Título de la parada" value={stop.title} onChange={(e) => updateStop(index, 'title', e.target.value)} />
              <Input placeholder="Notas (opcional)" value={stop.notes} onChange={(e) => updateStop(index, 'notes', e.target.value)} />
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  max={14}
                  aria-label={`Día de la parada ${index + 1}`}
                  value={stop.day}
                  onChange={(e) => updateStop(index, 'day', Math.max(1, Number(e.target.value) || 1))}
                  className="w-24"
                />
                <Input
                  type="time"
                  aria-label={`Hora de inicio de la parada ${index + 1}`}
                  value={stop.startTime}
                  onChange={(e) => updateStop(index, 'startTime', e.target.value)}
                  className="flex-1"
                />
              </div>
              <div className="flex gap-2">
                <Input placeholder="Duración (opcional)" value={stop.duration} onChange={(e) => updateStop(index, 'duration', e.target.value)} className="flex-1" />
                <Button type="button" variant="ghost" size="sm" onClick={() => removeStop(index)} className="shrink-0 text-destructive">Quitar</Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancelar</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creando...' : 'Crear ruta'}</Button>
        </div>
      </form>
    </Form>
  )
}

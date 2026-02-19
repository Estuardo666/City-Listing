'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { updateEventAction } from '@/actions/events'
import { eventSchema, type EventInput } from '@/schemas/event.schema'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MediaUrlInput } from '@/components/features/media/media-url-input'
import { LocationPickerMap } from '@/components/features/map/location-picker-map'
import type { EventWithRelations } from '@/types/event'
import type { EventCategory } from '@/types/event'
import type { VenueSelectOption } from '@/types/venue'

interface EventEditFormProps {
  event: EventWithRelations
  categories: EventCategory[]
  venues: VenueSelectOption[]
}

export function EventEditForm({ event, categories, venues }: EventEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toDateTimeLocalValue = (value: Date | null | undefined): string => {
    if (!value) return ''
    const date = value instanceof Date ? value : new Date(value)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
      date.getHours()
    )}:${pad(date.getMinutes())}`
  }

  const form = useForm<EventInput>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event.title,
      description: event.description,
      content: event.content,
      image: event.image,
      categoryId: event.category.id,
      venueId: event.venue?.id || null,
      startDate: event.startDate,
      endDate: event.endDate,
      price: event.price ?? null,
      location: event.location,
      address: event.address,
      lat: event.lat,
      lng: event.lng,
      featured: event.featured,
    },
  })

  const onSubmit = async (data: EventInput) => {
    setIsSubmitting(true)

    try {
      const result = await updateEventAction(event.id, data)

      if (result.success) {
        toast.success('Evento actualizado correctamente')
        window.location.href = '/dashboard/eventos'
      } else {
        toast.error(result.error ?? 'Error al actualizar el evento')
      }
    } catch {
      toast.error('Error al actualizar el evento')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Título del evento</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Festival de Música 2024" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio (opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ej: 15"
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const value = e.target.value
                      field.onChange(value === '' ? null : Number(value))
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Deja vacío si es gratis. Usa solo números.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ubicación</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Centro de Convenciones" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="venueId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Local (opcional)</FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(val === 'none' ? null : val)}
                  defaultValue={field.value || 'none'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un local" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Sin local específico</SelectItem>
                    {venues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Si el evento se realiza en un local registrado, selecciónalo aquí.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <MediaUrlInput
                label="Imagen destacada (URL)"
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                placeholder="https://..."
              />
            )}
          />

          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha y hora de inicio</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    value={toDateTimeLocalValue(field.value ? new Date(field.value) : null)}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha y hora de fin (opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    value={toDateTimeLocalValue(field.value ? new Date(field.value) : null)}
                    onChange={(e) => {
                      if (!e.target.value) {
                        field.onChange(null)
                        return
                      }

                      field.onChange(new Date(e.target.value))
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem className="md:col-span-2">
            <FormLabel>Ubicación en el mapa (opcional)</FormLabel>
            <FormDescription className="mb-2">
              Haz clic en el mapa para fijar la posición exacta del evento. Puedes arrastrar el pin para ajustarlo.
            </FormDescription>
            <LocationPickerMap
              lat={form.watch('lat')}
              lng={form.watch('lng')}
              onChange={(lat, lng) => {
                form.setValue('lat', lat, { shouldDirty: true })
                form.setValue('lng', lng, { shouldDirty: true })
              }}
              onClear={() => {
                form.setValue('lat', null, { shouldDirty: true })
                form.setValue('lng', null, { shouldDirty: true })
              }}
              mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? ''}
              className="h-64"
            />
          </FormItem>

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Calle Bolívar 10-25, Loja"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe el evento para el listado público"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contenido detallado (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Programación, entradas, información adicional..."
                  className="min-h-[140px]"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Actualizando evento...' : 'Actualizar evento'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

"use client"

import { useState } from "react"
import { type FieldErrors, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { eventSchema, type EventInput } from "@/schemas/event.schema"
import { createEventAction } from "@/actions/events"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MediaUrlInput } from '@/components/features/media/media-url-input'
import { LocationPickerMap } from "@/components/features/map/location-picker-map"
import { type EventCategory } from "@/types/event"
import type { VenueSelectOption } from "@/types/venue"

interface EventFormProps {
  categories: EventCategory[]
  venues: VenueSelectOption[]
  initialData?: Partial<EventInput>
}

export function EventForm({ categories, venues, initialData }: EventFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toDateTimeLocalValue = (value: Date | null | undefined): string => {
    if (!value) return ""
    const date = value instanceof Date ? value : new Date(value)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
      date.getHours()
    )}:${pad(date.getMinutes())}`
  }

  const form = useForm<EventInput>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      content: initialData?.content || null,
      image: initialData?.image || null,
      categoryId: initialData?.categoryId || "",
      startDate: initialData?.startDate ? new Date(initialData.startDate) : new Date(),
      endDate: initialData?.endDate || null,
      price: initialData?.price ?? null,
      location: initialData?.location || "",
      address: initialData?.address || null,
      lat: initialData?.lat || null,
      lng: initialData?.lng || null,
      venueId: initialData?.venueId || null,
      featured: initialData?.featured || false,
    },
  })

  const onSubmit = async (data: EventInput) => {
    setIsSubmitting(true)
    
    try {
      const result = await createEventAction(data)
      
      if (result.success) {
        toast.success("Evento creado correctamente")
        // Redirect to events list or event detail
        window.location.href = "/eventos"
      } else {
        toast.error(result.error || "Error al crear el evento")
      }
    } catch {
      toast.error("Error al crear el evento")
    } finally {
      setIsSubmitting(false)
    }
  }

  const onInvalid = (errors: FieldErrors<EventInput>) => {
    const firstKey = Object.keys(errors)[0] as keyof EventInput | undefined
    const firstMessage = firstKey ? errors[firstKey]?.message : undefined

    toast.error(firstMessage ?? "Revisa los campos requeridos")

    if (firstKey) {
      form.setFocus(firstKey)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Título del evento</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Festival de Música Loja 2024"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Un título claro y descriptivo para tu evento.
                </FormDescription>
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
                  <Input placeholder="Ej: Centro histórico de Loja" {...field} />
                </FormControl>
                <FormDescription>
                  Zona o referencia principal del evento.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="venueId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Local asociado (opcional)</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                  value={field.value ?? "none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un local" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Sin local asociado</SelectItem>
                    {venues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Relaciona el evento con un local aprobado para mostrar contexto adicional.
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
                    value={toDateTimeLocalValue(field.value instanceof Date ? field.value : new Date(field.value))}
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
                <FormDescription>
                  Si tu evento tiene una fecha de finalización definida.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem className="col-span-1 md:col-span-2">
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
              <FormItem className="col-span-1 md:col-span-2">
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Avenida 18 de Noviembre, Loja"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormDescription>
                  Ubicación exacta del evento (recomendado para que la gente llegue fácil).
                </FormDescription>
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
                  placeholder="Describe tu evento en detalle..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Información importante sobre el evento: actividades, participantes,
                requisitos, etc.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creando evento..." : "Crear evento"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

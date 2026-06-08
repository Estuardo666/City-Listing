'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createVenueAction } from '@/actions/venues'
import { venueSchema, type VenueInput } from '@/schemas/venue.schema'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MediaUrlInput } from '@/components/features/media/media-url-input'
import { VenueFormTextSections } from '@/components/features/venues/venue-form-text-sections'
import dynamic from 'next/dynamic'
import type { VenueCategory } from '@/types/venue'

const LocationPickerMap = dynamic(
  () => import('@/components/features/map/location-picker-map').then((mod) => mod.LocationPickerMap),
  { ssr: false }
)

type VenueFormProps = {
  categories: VenueCategory[]
  initialData?: Partial<VenueInput>
}

export function VenueForm({ categories, initialData }: VenueFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<VenueInput>({
    resolver: zodResolver(venueSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
      content: initialData?.content ?? null,
      image: initialData?.image ?? null,
      phone: initialData?.phone ?? null,
      email: initialData?.email ?? null,
      website: initialData?.website ?? null,
      location: initialData?.location ?? '',
      address: initialData?.address ?? null,
      lat: initialData?.lat ?? null,
      lng: initialData?.lng ?? null,
      categoryIds: initialData?.categoryIds ?? [],
      featured: initialData?.featured ?? false,
      priceRange: initialData?.priceRange ?? null,
    },
  })

  const onSubmit = async (data: VenueInput) => {
    setIsSubmitting(true)

    try {
      const result = await createVenueAction(data)

      if (result.success) {
        toast.success('Local registrado correctamente')
        window.location.href = '/locales'
      } else {
        toast.error(result.error ?? 'Error al registrar el local')
      }
    } catch {
      toast.error('Error al registrar el local')
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
            name="name"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Nombre del local</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Café Loja" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categorías</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const active = field.value.includes(category.id)
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => {
                          const next = active
                            ? field.value.filter((id: string) => id !== category.id)
                            : [...field.value, category.id]
                          field.onChange(next)
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                          active
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-border bg-card text-foreground hover:bg-muted/50 hover:border-foreground/20'
                        }`}
                      >
                        <span className="text-xs">{category.name}</span>
                      </button>
                    )
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priceRange"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rango de precios</FormLabel>
                <Select onValueChange={(v) => field.onChange(v === 'none' ? null : v)} defaultValue={field.value ?? 'none'}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No especificar</SelectItem>
                    <SelectItem value="$">$ - Económico</SelectItem>
                    <SelectItem value="$$">$$ - Moderado</SelectItem>
                    <SelectItem value="$$$">$$$ - Premium</SelectItem>
                    <SelectItem value="$$$$">$$$$ - Lujo</SelectItem>
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
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
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

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: +593 7 2571234"
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

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="contacto@local.com"
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

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sitio web</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://misitio.com"
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

          <FormItem className="md:col-span-2">
            <FormLabel>Ubicación en el mapa (opcional)</FormLabel>
            <FormDescription className="mb-2">
              Haz clic en el mapa para fijar la posición exacta del local. Puedes arrastrar el pin para ajustarlo.
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
        </div>

        <VenueFormTextSections control={form.control} />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Registrando local...' : 'Registrar local'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

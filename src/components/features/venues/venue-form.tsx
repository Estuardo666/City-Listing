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
import { LocationPickerMap } from '@/components/features/map/location-picker-map'
import type { VenueCategory } from '@/types/venue'

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
      categoryId: initialData?.categoryId ?? '',
      featured: initialData?.featured ?? false,
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

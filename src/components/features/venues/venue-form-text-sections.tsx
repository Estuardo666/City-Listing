import type { Control } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import type { VenueInput } from '@/schemas/venue.schema'

type VenueFormTextSectionsProps = {
  control: Control<VenueInput>
}

export function VenueFormTextSections({ control }: VenueFormTextSectionsProps) {
  return (
    <>
      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descripción breve</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe el local para el listado público"
                className="min-h-[100px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="content"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Contenido detallado (opcional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Historia, horarios, menú, servicios, recomendaciones..."
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
    </>
  )
}

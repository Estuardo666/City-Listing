import { z } from 'zod'
import {
  eventListFiltersSchema,
  eventSchema,
  eventStatusSchema,
  eventStatusUpdateSchema,
} from '@/schemas/event.schema'
import { venueSchema } from '@/schemas/venue.schema'

export const postSchema = z.object({
  title: z.string().min(3, 'Mínimo 3 caracteres'),
  excerpt: z.string().optional(),
  content: z.string().min(10, 'Mínimo 10 caracteres'),
  image: z.string().optional(),
  categoryId: z.string().min(1, 'Selecciona una categoría'),
})

export const categorySchema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres'),
  slug: z.string().min(3, 'Mínimo 3 caracteres'),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  type: z.enum(['EVENT', 'VENUE', 'POST']),
})

export type EventInput = z.infer<typeof eventSchema>
export type VenueInput = z.infer<typeof venueSchema>
export type PostInput = z.infer<typeof postSchema>
export type CategoryInput = z.infer<typeof categorySchema>
export type EventListFiltersInput = z.infer<typeof eventListFiltersSchema>
export type EventStatusUpdateInput = z.infer<typeof eventStatusUpdateSchema>

export {
  eventSchema,
  eventListFiltersSchema,
  eventStatusSchema,
  eventStatusUpdateSchema,
  venueSchema,
}

import { z } from 'zod'

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Selecciona una calificación').max(5, 'Máximo 5 estrellas'),
  title: z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return null
    if (typeof value === 'string') return value.trim()
    return value
  }, z.string().max(120, 'Máximo 120 caracteres').nullable()),
  content: z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return null
    if (typeof value === 'string') return value.trim()
    return value
  }, z.string().max(1000, 'Máximo 1000 caracteres').nullable()),
})

export const reviewListFiltersSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  sort: z.enum(['newest', 'highest', 'lowest']).optional().default('newest'),
})

export type ReviewInput = z.infer<typeof reviewSchema>
export type ReviewListFiltersInput = z.infer<typeof reviewListFiltersSchema>

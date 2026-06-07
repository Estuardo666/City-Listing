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
  photos: z.array(z.string().url('URL de foto inválida')).max(5, 'Máximo 5 fotos').optional().default([]),
})

export const reviewListFiltersSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  sort: z.enum(['newest', 'highest', 'lowest']).optional().default('newest'),
})

export const reviewStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED'])

export const reviewStatusUpdateSchema = z.object({
  reviewId: z.string().trim().min(1, 'ID inválido'),
  status: reviewStatusSchema,
})

export const adminReviewStatusFilterSchema = z
  .enum(['ALL', 'PENDING', 'APPROVED', 'REJECTED'])
  .optional()
  .default('ALL')

export const adminReviewFiltersSchema = z.object({
  status: adminReviewStatusFilterSchema,
  entityType: z.enum(['ALL', 'VENUE', 'EVENT']).optional().default('ALL'),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  category: z.string().trim().optional(),
  search: z.string().trim().optional().default(''),
  flagged: z.coerce.boolean().optional().default(false),
  sort: z.enum(['newest', 'oldest', 'lowest-rating', 'highest-rating']).optional().default('newest'),
})

export type ReviewInput = z.infer<typeof reviewSchema>
export type ReviewListFiltersInput = z.infer<typeof reviewListFiltersSchema>
export type ReviewStatusUpdateInput = z.infer<typeof reviewStatusUpdateSchema>
export type AdminReviewStatusFilterInput = z.infer<typeof adminReviewStatusFilterSchema>
export type AdminReviewFiltersInput = z.infer<typeof adminReviewFiltersSchema>

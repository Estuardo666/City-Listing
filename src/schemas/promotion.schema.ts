import { z } from 'zod'

export const promotionSchema = z.object({
  title: z.string().trim().min(3, 'Mínimo 3 caracteres').max(120, 'Máximo 120 caracteres'),
  description: z.string().trim().min(10, 'Mínimo 10 caracteres').max(500, 'Máximo 500 caracteres'),
  image: z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return null
    if (typeof value === 'string') return value.trim()
    return value
  }, z.string().url('URL inválida').nullable()),
  discount: z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return null
    if (typeof value === 'string') return value.trim()
    return value
  }, z.string().max(50, 'Máximo 50 caracteres').nullable()),
  validFrom: z.coerce.date(),
  validUntil: z.coerce.date(),
  terms: z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return null
    if (typeof value === 'string') return value.trim()
    return value
  }, z.string().max(500).nullable()),
  featured: z.coerce.boolean().optional().default(false),
}).superRefine((value, ctx) => {
  if (value.validUntil < value.validFrom) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['validUntil'],
      message: 'La fecha de fin no puede ser anterior al inicio',
    })
  }
})

export const promotionStatusUpdateSchema = z.object({
  promotionId: z.string().min(1, 'ID inválido'),
  status: z.enum(['PENDING', 'ACTIVE', 'EXPIRED', 'REJECTED']),
})

export type PromotionInput = z.infer<typeof promotionSchema>
export type PromotionStatusUpdateInput = z.infer<typeof promotionStatusUpdateSchema>

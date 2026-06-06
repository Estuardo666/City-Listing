import { z } from 'zod'

export const venueClaimSchema = z.object({
  message: z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return null
    if (typeof value === 'string') return value.trim()
    return value
  }, z.string().max(500, 'Máximo 500 caracteres').nullable()),
  proof: z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return null
    if (typeof value === 'string') return value.trim()
    return value
  }, z.string().url('URL inválida').nullable()),
})

export const venueClaimStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED'])

export const venueClaimUpdateSchema = z.object({
  claimId: z.string().min(1, 'ID inválido'),
  status: venueClaimStatusSchema,
  adminNotes: z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return null
    if (typeof value === 'string') return value.trim()
    return value
  }, z.string().max(500).nullable()),
})

export type VenueClaimInput = z.infer<typeof venueClaimSchema>
export type VenueClaimUpdateInput = z.infer<typeof venueClaimUpdateSchema>

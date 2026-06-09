import { z } from 'zod'

// ── Paso 1: Datos del solicitante ──────────────────────────────────
export const claimSubmitSchema = z.object({
  venueId: z.string().min(1, 'ID de local requerido'),
  claimerName: z
    .string()
    .min(2, 'Nombre requerido')
    .max(120, 'Máximo 120 caracteres'),
  claimerEmail: z
    .string()
    .email('Correo electrónico inválido')
    .max(200, 'Máximo 200 caracteres'),
  claimerPhone: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : String(v).trim()),
    z.string().max(30, 'Máximo 30 caracteres').nullable(),
  ),
  claimerRole: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : String(v).trim()),
    z.string().max(80, 'Máximo 80 caracteres').nullable(),
  ),
  message: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : String(v).trim()),
    z.string().max(500, 'Máximo 500 caracteres').nullable(),
  ),
})

export type ClaimSubmitInput = z.infer<typeof claimSubmitSchema>

// ── Paso 2: Verificación de código ─────────────────────────────────
export const claimVerifySchema = z.object({
  claimId: z.string().min(1, 'ID requerido'),
  code: z
    .string()
    .length(6, 'El código debe tener 6 dígitos')
    .regex(/^\d{6}$/, 'El código debe ser numérico'),
})

export type ClaimVerifyInput = z.infer<typeof claimVerifySchema>

// ── Admin: aprobar / rechazar ──────────────────────────────────────
export const venueClaimStatusSchema = z.enum(['PENDING', 'VERIFIED', 'APPROVED', 'REJECTED'])

export const venueClaimUpdateSchema = z.object({
  claimId: z.string().min(1, 'ID inválido'),
  status: venueClaimStatusSchema,
  adminNotes: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : String(v).trim()),
    z.string().max(500).nullable(),
  ),
})

export type VenueClaimUpdateInput = z.infer<typeof venueClaimUpdateSchema>

import { z } from 'zod'

export const reservationSchema = z.object({
  venueId: z.string().min(1, 'Local inválido').optional(),
  eventId: z.string().min(1, 'Evento inválido').optional(),
  date: z.coerce.date(),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)'),
  partySize: z.coerce.number().int().min(1, 'Mínimo 1 persona').max(50, 'Máximo 50 personas'),
  notes: z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return null
    if (typeof value === 'string') return value.trim()
    return value
  }, z.string().max(500).nullable()),
})

export const reservationStatusUpdateSchema = z.object({
  reservationId: z.string().min(1, 'ID inválido'),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']),
  cancelReason: z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return null
    if (typeof value === 'string') return value.trim()
    return value
  }, z.string().max(300).nullable()),
})

export const reservationSettingsSchema = z.object({
  acceptsReservations: z.coerce.boolean().default(true),
  maxPartySize: z.coerce.number().int().min(1).max(100).default(20),
  timeSlotDuration: z.coerce.number().int().min(15).max(240).default(60),
  openingTime: z.string().regex(/^\d{2}:\d{2}$/).default('09:00'),
  closingTime: z.string().regex(/^\d{2}:\d{2}$/).default('22:00'),
  autoConfirm: z.coerce.boolean().default(false),
  cancelBeforeHours: z.coerce.number().int().min(1).max(72).default(2),
})

export type ReservationInput = z.infer<typeof reservationSchema>
export type ReservationStatusUpdateInput = z.infer<typeof reservationStatusUpdateSchema>
export type ReservationSettingsInput = z.infer<typeof reservationSettingsSchema>

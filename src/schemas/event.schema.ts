import { z } from 'zod'

export const eventStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED'])

const optionalTextSchema = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return undefined
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed === '' ? undefined : trimmed
  }

  return value
}, z.string().optional()).transform((value) => value ?? '')

const optionalNullableTextSchema = optionalTextSchema.transform((value) => (value === '' ? null : value))

const optionalNullableNumberSchema = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  return Number(value)
}, z.number().finite().nullable())

export const eventSchema = z.object({
  title: z.string().trim().min(3, 'Mínimo 3 caracteres').max(120, 'Máximo 120 caracteres'),
  description: z.string().trim().min(10, 'Mínimo 10 caracteres').max(1000, 'Máximo 1000 caracteres'),
  content: optionalNullableTextSchema,
  image: optionalNullableTextSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  price: z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return null
    return Number(value)
  }, z.number().min(0, 'El precio no puede ser negativo').nullable()),
  location: z.string().trim().min(3, 'Mínimo 3 caracteres').max(150, 'Máximo 150 caracteres'),
  address: optionalNullableTextSchema,
  lat: optionalNullableNumberSchema.refine(
    (value) => value === null || (value >= -90 && value <= 90),
    'Latitud inválida'
  ),
  lng: optionalNullableNumberSchema.refine(
    (value) => value === null || (value >= -180 && value <= 180),
    'Longitud inválida'
  ),
  venueId: z.preprocess((value) => {
    if (value === '' || value === 'none' || value === null || value === undefined) {
      return null
    }

    if (typeof value === 'string') {
      return value.trim()
    }

    return value
  }, z.string().min(1, 'Local inválido').nullable()),
  categoryId: z.string().trim().min(1, 'Selecciona una categoría'),
  featured: z.coerce.boolean().optional().default(false),
}).superRefine((value, ctx) => {
  if (value.endDate && value.endDate < value.startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endDate'],
      message: 'La fecha de fin no puede ser anterior al inicio',
    })
  }
})

export const eventListFiltersSchema = z.object({
  q: z.string().trim().optional().default(''),
  category: z.string().trim().optional().default(''),
  featured: z.enum(['all', 'true']).optional().default('all'),
  status: eventStatusSchema.optional().default('APPROVED'),
})

export const eventStatusUpdateSchema = z.object({
  eventId: z.string().trim().min(1, 'ID inválido'),
  status: eventStatusSchema,
})

export const adminEventStatusFilterSchema = z
  .enum(['ALL', 'PENDING', 'APPROVED', 'REJECTED'])
  .optional()
  .default('PENDING')

export const upcomingEventNotificationInputSchema = z.object({
  hoursAhead: z.coerce.number().int().min(1).max(168).optional().default(48),
  limit: z.coerce.number().int().min(1).max(25).optional().default(6),
})

export type EventInput = z.infer<typeof eventSchema>
export type EventListFiltersInput = z.infer<typeof eventListFiltersSchema>
export type EventStatusUpdateInput = z.infer<typeof eventStatusUpdateSchema>
export type AdminEventStatusFilterInput = z.infer<typeof adminEventStatusFilterSchema>
export type UpcomingEventNotificationInput = z.infer<typeof upcomingEventNotificationInputSchema>

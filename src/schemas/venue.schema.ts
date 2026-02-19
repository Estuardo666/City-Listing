import { z } from 'zod'

export const venueStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED'])

const optionalNullableTextSchema = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  if (typeof value === 'string') {
    return value.trim()
  }

  return value
}, z.string().nullable())

const optionalNullableNumberSchema = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  return Number(value)
}, z.number().finite().nullable())

const optionalNullableEmailSchema = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  return value
}, z.string().email('Correo electrónico inválido').nullable())

const optionalNullableUrlSchema = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  return value
}, z.string().url('URL inválida').nullable())

export const venueSchema = z.object({
  name: z.string().trim().min(3, 'Mínimo 3 caracteres').max(120, 'Máximo 120 caracteres'),
  description: z.string().trim().min(10, 'Mínimo 10 caracteres').max(800, 'Máximo 800 caracteres'),
  content: optionalNullableTextSchema,
  image: optionalNullableUrlSchema,
  phone: optionalNullableTextSchema,
  email: optionalNullableEmailSchema,
  website: optionalNullableUrlSchema,
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
  categoryId: z.string().trim().min(1, 'Selecciona una categoría'),
  featured: z.coerce.boolean().optional().default(false),
})

export const venueListFiltersSchema = z.object({
  q: z.string().trim().optional().default(''),
  category: z.string().trim().optional().default(''),
  featured: z.enum(['all', 'true']).optional().default('all'),
  status: venueStatusSchema.optional().default('APPROVED'),
})

export const venueStatusUpdateSchema = z.object({
  venueId: z.string().trim().min(1, 'ID inválido'),
  status: venueStatusSchema,
})

export const adminVenueStatusFilterSchema = z
  .enum(['ALL', 'PENDING', 'APPROVED', 'REJECTED'])
  .optional()
  .default('PENDING')

export type VenueInput = z.infer<typeof venueSchema>
export type VenueListFiltersInput = z.infer<typeof venueListFiltersSchema>
export type VenueStatusUpdateInput = z.infer<typeof venueStatusUpdateSchema>
export type AdminVenueStatusFilterInput = z.infer<typeof adminVenueStatusFilterSchema>

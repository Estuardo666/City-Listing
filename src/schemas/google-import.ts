import { z } from 'zod'

export const GoogleSearchSchema = z.object({
  country: z.string().min(1, 'País requerido'),
  province: z.string().min(1, 'Provincia requerida'),
  city: z.string().min(1, 'Ciudad requerida'),
  categories: z.array(z.string()).min(1, 'Selecciona al menos una categoría'),
  radius: z.number().min(1000).max(50000, 'Radio máximo 50km'),
})

export type GoogleSearchInput = z.infer<typeof GoogleSearchSchema>

export const GoogleImportItemSchema = z.object({
  google_place_id: z.string(),
  name: z.string(),
  category: z.string(),
  address: z.string(),
  phone: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
})

export const GoogleImportSchema = z.object({
  places: z.array(GoogleImportItemSchema),
  categoryIds: z.array(z.string()).min(1, 'Categoría requerida'),
  subcategoryIds: z.array(z.string()).optional(),
  duplicateAction: z.enum(['skip', 'update']).default('skip'),
})

export type GoogleImportInput = z.infer<typeof GoogleImportSchema>

export const GoogleBulkImportSchema = z.object({
  places: z.array(GoogleImportItemSchema),
  categoryIds: z.array(z.string()).min(1, 'Categoría requerida'),
  subcategoryIds: z.array(z.string()).optional(),
  duplicateAction: z.enum(['skip', 'update']).default('skip'),
  country: z.string().min(1),
  province: z.string().min(1),
  city: z.string().min(1),
  categories: z.array(z.string()),
  radius: z.number(),
})

export type GoogleBulkImportInput = z.infer<typeof GoogleBulkImportSchema>

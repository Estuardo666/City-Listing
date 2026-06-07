import { z } from 'zod'
import { OSM_CATEGORY_KEYS } from '@/types/osm-import'

export const OsmSearchSchema = z.object({
  city: z.string().min(1, 'La ciudad es requerida'),
  country: z.string().min(1, 'El país es requerido'),
  radius: z.coerce.number().min(100).max(50000).default(5000),
  categories: z.array(z.enum(OSM_CATEGORY_KEYS as [string, ...string[]])).min(1, 'Selecciona al menos una categoría'),
})

export type OsmSearchInput = z.infer<typeof OsmSearchSchema>

export const OsmConfigSchema = z.object({
  overpassUrl: z.string().url('URL inválida').min(1),
  timeout: z.coerce.number().min(5, 'Mínimo 5 segundos').max(300, 'Máximo 300 segundos'),
  maxResults: z.coerce.number().min(10).max(10000),
  delayBetween: z.coerce.number().min(0).max(30000),
  userAgent: z.string().min(1, 'User-Agent es requerido'),
  syncFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).nullable().optional(),
  syncEnabled: z.boolean(),
})

export type OsmConfigInput = z.infer<typeof OsmConfigSchema>

export const OsmBulkImportSchema = z.object({
  places: z.array(z.any()).min(1, 'No hay lugares seleccionados'),
  categoryId: z.string().min(1, 'La categoría es requerida'),
  importId: z.string().optional(),
  options: z.object({
    skipDuplicates: z.boolean().default(true),
    updateExisting: z.boolean().default(false),
    batchSize: z.coerce.number().min(1).max(100).default(20),
  }).default({}),
})

export type OsmBulkImportInput = z.infer<typeof OsmBulkImportSchema>

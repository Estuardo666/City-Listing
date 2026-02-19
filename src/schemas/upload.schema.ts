import { z } from 'zod'

export const MAX_MEDIA_SIZE_BYTES = 15 * 1024 * 1024

export const allowedMediaMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
] as const

export const uploadMediaSchema = z.object({
  name: z.string().trim().min(1, 'Nombre de archivo inválido').max(180, 'Nombre demasiado largo'),
  type: z.enum(allowedMediaMimeTypes, {
    errorMap: () => ({ message: 'Formato no permitido. Usa imagen o video compatible.' }),
  }),
  size: z
    .number()
    .int()
    .positive('Archivo vacío o inválido')
    .max(MAX_MEDIA_SIZE_BYTES, 'El archivo supera el tamaño máximo de 15MB'),
})

export type UploadMediaInput = z.infer<typeof uploadMediaSchema>

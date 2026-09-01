import { randomUUID } from 'node:crypto'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'
import { uploadMediaSchema } from '@/schemas/upload.schema'

function getSafeExtension(fileName: string, mimeType: string): string {
  const rawExt = fileName.split('.').pop()?.toLowerCase() ?? ''
  if (rawExt.length > 0 && /^[a-z0-9]+$/.test(rawExt)) return rawExt
  const byMime: Record<string, string> = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif',
    'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov',
  }
  return byMime[mimeType] ?? 'bin'
}

export async function POST(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para subir archivos.', 401)
  try {
    const formData = await request.formData()
    const maybeFile = formData.get('file')
    if (!(maybeFile instanceof File)) return mobileError('VALIDATION_ERROR', 'Debes seleccionar un archivo válido.', 422)
    const parsed = uploadMediaSchema.safeParse({ name: maybeFile.name, type: maybeFile.type, size: maybeFile.size })
    if (!parsed.success) return mobileError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Archivo inválido.', 422)
    const { uploadBufferToR2, getR2PublicUrl } = await import('@/lib/storage/r2')
    const key = `mobile/${principal.userId}/${Date.now()}-${randomUUID()}.${getSafeExtension(parsed.data.name, parsed.data.type)}`
    await uploadBufferToR2({ key, body: Buffer.from(await maybeFile.arrayBuffer()), contentType: parsed.data.type })
    return mobileSuccess({ key, url: getR2PublicUrl(key), contentType: parsed.data.type, size: parsed.data.size })
  } catch {
    return mobileError('UPLOAD_FAILED', 'No se pudo subir el archivo. Intenta nuevamente.', 500)
  }
}

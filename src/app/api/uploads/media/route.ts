import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getR2PublicUrl, uploadBufferToR2 } from '@/lib/storage/r2'
import { uploadMediaSchema } from '@/schemas/upload.schema'

type UploadMediaResponse = {
  success: boolean
  data?: {
    key: string
    url: string
  }
  error?: string
}

function getSafeExtension(fileName: string, mimeType: string): string {
  const rawExt = fileName.split('.').pop()?.toLowerCase() ?? ''

  if (rawExt.length > 0 && /^[a-z0-9]+$/.test(rawExt)) {
    return rawExt
  }

  const byMime: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
  }

  return byMime[mimeType] ?? 'bin'
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json<UploadMediaResponse>(
        {
          success: false,
          error: 'No autorizado para subir archivos.',
        },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const maybeFile = formData.get('file')

    if (!(maybeFile instanceof File)) {
      return NextResponse.json<UploadMediaResponse>(
        {
          success: false,
          error: 'Debes seleccionar un archivo válido.',
        },
        { status: 400 }
      )
    }

    const parsed = uploadMediaSchema.safeParse({
      name: maybeFile.name,
      type: maybeFile.type,
      size: maybeFile.size,
    })

    if (!parsed.success) {
      return NextResponse.json<UploadMediaResponse>(
        {
          success: false,
          error: parsed.error.issues[0]?.message ?? 'Archivo inválido.',
        },
        { status: 400 }
      )
    }

    const bytes = await maybeFile.arrayBuffer()
    const fileBuffer = Buffer.from(bytes)
    const extension = getSafeExtension(parsed.data.name, parsed.data.type)
    const objectKey = `media/${session.user.id}/${Date.now()}-${randomUUID()}.${extension}`

    await uploadBufferToR2({
      key: objectKey,
      body: fileBuffer,
      contentType: parsed.data.type,
    })

    return NextResponse.json<UploadMediaResponse>({
      success: true,
      data: {
        key: objectKey,
        url: getR2PublicUrl(objectKey),
      },
    })
  } catch {
    return NextResponse.json<UploadMediaResponse>(
      {
        success: false,
        error: 'No se pudo subir el archivo. Intenta nuevamente.',
      },
      { status: 500 }
    )
  }
}

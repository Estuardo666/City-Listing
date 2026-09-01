import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

const postSchema = z.object({
  title: z.string().trim().min(3).max(160),
  excerpt: z.string().trim().max(500).optional(),
  content: z.string().trim().min(20).max(20_000),
  image: z.string().url().max(2_000).optional(),
  categoryId: z.string().trim().min(1),
})

const postSelect = { id: true, title: true, slug: true, excerpt: true, content: true, image: true, status: true, createdAt: true, category: { select: { id: true, name: true, slug: true } } } as const

export async function GET(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para ver tus artículos.', 401)
  const posts = await prisma.post.findMany({ where: { userId: principal.userId }, orderBy: { createdAt: 'desc' }, take: 100, select: postSelect })
  return mobileSuccess(posts)
}

export async function POST(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para publicar un artículo.', 401)
  const parsed = postSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'El artículo no es válido.', 422, parsed.error.flatten().fieldErrors)
  const category = await prisma.category.findUnique({ where: { id: parsed.data.categoryId }, select: { id: true } })
  if (!category) return mobileError('NOT_FOUND', 'La categoría no está disponible.', 404)
  const baseSlug = slugify(parsed.data.title) || 'articulo'
  const post = await prisma.post.create({ data: { userId: principal.userId, title: parsed.data.title, slug: `${baseSlug}-${randomBytes(3).toString('hex')}`, excerpt: parsed.data.excerpt, content: parsed.data.content, image: parsed.data.image, categoryId: parsed.data.categoryId, status: 'PENDING' }, select: postSelect })
  return mobileSuccess(post, { moderation: 'PENDING' })
}

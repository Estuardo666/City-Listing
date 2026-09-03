import { ImageResponse } from 'next/og'

import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const alt = 'Colección en Vive Loja'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * Share card for a public collection. Shared links are the point of the feature,
 * and without this they render as the generic site image, which tells the
 * recipient nothing about what they were sent.
 */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const collection = await prisma.collection.findFirst({
    where: { slug, isPublic: true },
    select: {
      name: true,
      description: true,
      icon: true,
      user: { select: { name: true } },
      _count: { select: { items: true } },
    },
  })

  const title = collection?.name ?? 'Colección'
  const author = collection?.user.name ?? 'la comunidad'
  const count = collection?._count.items ?? 0

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          background: 'linear-gradient(135deg, #1437d2 0%, #0b1d78 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 72 }}>{collection?.icon ?? '📍'}</div>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1 }}>{title}</div>
          {collection?.description ? (
            <div style={{ fontSize: 32, opacity: 0.85, lineHeight: 1.3 }}>
              {collection.description.slice(0, 140)}
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 30, opacity: 0.9 }}>
          <div>
            {count} {count === 1 ? 'lugar' : 'lugares'} · por {author}
          </div>
          <div style={{ fontWeight: 700 }}>Vive Loja</div>
        </div>
      </div>
    ),
    size,
  )
}

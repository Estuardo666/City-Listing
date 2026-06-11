import { prisma } from '@/lib/prisma'
import { PromotionCard } from '@/components/promotion/promotion-card'

export const metadata = {
  title: 'Ofertas y promociones - Vive Loja',
  description:
    'Aprovecha descuentos, promociones y ofertas activas de locales en Loja, Ecuador. Restaurantes, cafés, bares y servicios con precios especiales actualizados.',
  openGraph: {
    title: 'Ofertas y Promociones en Loja | Vive Loja',
    description: 'Descuentos y promociones activas de locales en Loja, Ecuador.',
    url: 'https://viveloja.com/ofertas',
    siteName: 'Vive Loja',
    images: [{ url: 'https://viveloja.com/viveloja.png', width: 1200, height: 630, alt: 'Ofertas en Loja - Vive Loja' }],
    locale: 'es_EC',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ofertas y Promociones en Loja',
    description: 'Descuentos y promociones activas de locales en Loja, Ecuador.',
    images: ['https://viveloja.com/viveloja.png'],
  },
  alternates: { canonical: 'https://viveloja.com/ofertas' },
}

export const dynamic = 'force-dynamic'

export default async function OffersPage() {
  const now = new Date()
  const promotions = await prisma.promotion.findMany({
    where: {
      status: 'ACTIVE',
      validUntil: { gte: now },
    },
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    include: {
      venue: {
        select: { name: true, slug: true },
      },
    },
  })

  return (
    <div className="pb-20 pt-10 sm:pt-14">
      <section className="section-shell space-y-8">
        <div>
          <h1 className="text-2xl font-medium sm:text-3xl">Ofertas y promociones</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Las mejores ofertas de locales en Loja
          </p>
        </div>

        {promotions.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {promotions.map((promo) => (
              <PromotionCard key={promo.id} promotion={promo} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg font-semibold text-muted-foreground">No hay ofertas activas</p>
            <p className="mt-1 text-sm text-muted-foreground">Vuelve pronto para ver nuevas ofertas</p>
          </div>
        )}
      </section>
    </div>
  )
}

import type { Metadata } from 'next'
import { getPublishedCatalog } from '@/lib/billing/plans'
import { PricingCards } from '@/components/billing/pricing-cards'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Planes para tu negocio — Vive Loja', description: 'Elige cómo quieres que tu negocio crezca en Vive Loja.' }

export default async function PlansPage() {
  const catalog = await getPublishedCatalog()
  return (
    <main className="pb-20 pt-14">
      <section className="section-shell space-y-10">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <p className="eyebrow text-primary">Presencia que se nota en Loja</p>
          <h1 className="text-4xl sm:text-5xl">Haz que tu negocio encuentre su próximo cliente.</h1>
          <p className="text-base text-muted-foreground">Empieza con lo esencial y suma herramientas cuando tu operación las necesite. Tus datos siempre se conservan.</p>
        </div>
        <PricingCards catalog={catalog} />
        <div className="mx-auto grid max-w-4xl gap-4 text-sm text-muted-foreground sm:grid-cols-3">
          <p><span className="font-semibold text-foreground">¿Cambias de plan?</span><br />Los beneficios nuevos se aplican al instante. Las reducciones no borran tu contenido.</p>
          <p><span className="font-semibold text-foreground">¿Tienes varias sucursales?</span><br />Las ubicaciones y miembros se cuentan en una sola cuenta empresarial.</p>
          <p><span className="font-semibold text-foreground">¿Es beta?</span><br />Sí. No hay cobros reales ni renovación automática.</p>
        </div>
      </section>
    </main>
  )
}

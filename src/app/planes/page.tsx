import type { Metadata } from 'next'
import { getPublishedCatalog } from '@/lib/billing/plans'
import { PricingCards } from '@/components/billing/pricing-cards'
import { ChevronDown } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Planes para tu negocio — Vive Loja', description: 'Elige cómo quieres que tu negocio crezca en Vive Loja.' }

export default async function PlansPage() {
  const catalog = await getPublishedCatalog()
  return (
    <main className="pb-20 pt-14">
      <section className="section-shell space-y-10">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <p className="eyebrow text-primary">Presencia que se nota en Loja</p>
          <h1 className="text-4xl sm:text-5xl">Planes y precios para hacer crecer tu negocio.</h1>
          <p className="text-base text-muted-foreground">Empieza con lo esencial y suma herramientas cuando tu operación las necesite. Tus datos siempre se conservan.</p>
        </div>
        <PricingCards catalog={catalog} showComparison />
        <div className="mx-auto grid max-w-4xl gap-4 text-sm text-muted-foreground sm:grid-cols-3">
          <p><span className="font-semibold text-foreground">¿Cambias de plan?</span><br />Los beneficios nuevos se aplican al instante. Las reducciones no borran tu contenido.</p>
          <p><span className="font-semibold text-foreground">¿Tienes varias sucursales?</span><br />Las ubicaciones y miembros se cuentan en una sola cuenta empresarial.</p>
          <p><span className="font-semibold text-foreground">¿Es beta?</span><br />Sí. No hay cobros reales ni renovación automática.</p>
        </div>
        <section className="mx-auto w-full max-w-4xl space-y-3" aria-labelledby="pricing-faq-title">
          <p className="eyebrow text-primary">Preguntas frecuentes</p>
          <h2 id="pricing-faq-title" className="text-2xl font-semibold">Antes de publicar</h2>
          <div className="divide-y divide-border/70 rounded-2xl border border-border/70 bg-card px-5">
            <details className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">¿Tengo que registrarme antes de elegir?<ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" /></summary>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">No. Primero comparas y eliges un plan. Luego creas tu acceso para publicar; conservamos tu elección y no te enviamos al onboarding de intereses.</p>
            </details>
            <details className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">¿Qué correo voy a recibir?<ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" /></summary>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Recibirás un código para verificar tu correo y, cuando el plan quede activo, una confirmación con la vigencia y el acceso para publicar tu local.</p>
            </details>
            <details className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">¿La beta hace un cobro o renueva automáticamente?<ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" /></summary>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">No. Todos los planes de esta etapa se activan por $0, no pedimos tarjeta y no hay renovación automática. El precio visible es solo la referencia comercial.</p>
            </details>
          </div>
        </section>
      </section>
    </main>
  )
}

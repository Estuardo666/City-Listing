'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useSession } from 'next-auth/react'
import { Check, Loader2, Sparkles } from 'lucide-react'
import { activatePlanAction } from '@/actions/billing/checkout'

type Capabilities = {
  maxLocations: number | null
  maxMembers: number | null
  maxMediaPerVenue: number | null
  menuEnabled: boolean
  monthlyEventsPerVenue: number | null
  maxActivePromotionsPerVenue: number | null
  analyticsRetentionDays: number | null
  whatsappEnabled: boolean
  messagingEnabled: boolean
  reservationsEnabled: boolean
  includedBoostCredits: number
}

type CatalogPlan = {
  slug: string
  name: string
  description: string | null
  versionId?: string
  monthlyPrice?: number
  annualPrice?: number
  currency?: string
  capabilities?: Capabilities
}

type Catalog = {
  plans: CatalogPlan[]
  simulation: { enabled: boolean; label: string; chargedAmount: number; renewsAutomatically: boolean }
}

const money = (value = 0) => new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value)

function benefitLines(plan: CatalogPlan) {
  const c = plan.capabilities
  if (!c) return []
  return [
    `${c.maxLocations === null ? 'Ubicaciones configurables' : `${c.maxLocations} ubicación${c.maxLocations === 1 ? '' : 'es'}`}`,
    `${c.maxMembers === null ? 'Equipo configurable' : `${c.maxMembers} miembro${c.maxMembers === 1 ? '' : 's'}`}`,
    `${c.maxMediaPerVenue === null ? 'Multimedia configurable' : `${c.maxMediaPerVenue} archivos multimedia por local`}`,
    c.menuEnabled ? 'Menú y productos' : 'Ficha esencial del local',
    c.monthlyEventsPerVenue === null ? 'Eventos sin límite de ciclo' : `${c.monthlyEventsPerVenue} eventos por local al mes`,
    c.maxActivePromotionsPerVenue === null ? 'Promociones configurables' : `${c.maxActivePromotionsPerVenue} promociones activas`,
    c.analyticsRetentionDays ? `Analytics de ${c.analyticsRetentionDays} días` : c.analyticsRetentionDays === null && plan.slug !== 'free' ? 'Analytics histórico' : 'Resumen de presencia',
    c.whatsappEnabled ? 'WhatsApp y contacto directo' : 'Contacto básico',
    c.reservationsEnabled ? 'Mensajes y reservas completas' : c.messagingEnabled ? 'Mensajes básicos' : 'Preguntas y reseñas',
  ]
}

export function PricingCards({ catalog, currentSlug }: { catalog: Catalog; currentSlug?: string | null }) {
  const { status } = useSession()
  const [cycle, setCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY')
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  function activate(planSlug: string) {
    if (status !== 'authenticated') return
    setMessage(null)
    startTransition(async () => {
      const result = await activatePlanAction({ planSlug, cycle, idempotencyKey: crypto.randomUUID(), device: 'web' })
      setMessage(result.success ? 'Plan activado. Tu dashboard ya está actualizado.' : result.error ?? 'No se pudo activar el plan.')
    })
  }

  return (
    <div className="space-y-8">
      <div className="mx-auto flex w-fit items-center gap-1 rounded-full border border-border/70 bg-card p-1 shadow-sm" role="group" aria-label="Ciclo de facturación">
        {(['MONTHLY', 'ANNUAL'] as const).map((value) => (
          <button key={value} type="button" onClick={() => setCycle(value)} className={`min-h-11 rounded-full px-5 text-sm font-semibold transition-colors ${cycle === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {value === 'MONTHLY' ? 'Mensual' : 'Anual · ahorra 17%'}
          </button>
        ))}
      </div>

      {message && <p role="status" className="mx-auto max-w-xl rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-800">{message}</p>}

      <div className="grid gap-4 lg:grid-cols-4">
        {catalog.plans.map((plan) => {
          const isCurrent = currentSlug === plan.slug
          const isPro = plan.slug === 'pro'
          const isRed = plan.slug === 'red'
          const price = cycle === 'ANNUAL' ? plan.annualPrice : plan.monthlyPrice
          return (
            <article key={plan.slug} className={`relative flex flex-col rounded-[1.5rem] border bg-card p-6 transition-transform duration-200 hover:-translate-y-1 ${isPro ? 'border-primary/60 shadow-lg shadow-primary/10 ring-1 ring-primary/20' : 'border-border/70'}`}>
              {isPro && <span className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground"><Sparkles className="h-3 w-3" /> Más elegido</span>}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{plan.name}</p>
                <h2 className="text-3xl font-medium">{isRed ? 'Desde $99' : money(price)}</h2>
                <p className="min-h-10 text-sm text-muted-foreground">{isRed ? 'Diseñado contigo para una red de locales.' : plan.description}</p>
              </div>
              <div className="mt-6 flex-1 space-y-3 border-t border-border/60 pt-5">
                {benefitLines(plan).map((benefit) => <p key={benefit} className="flex gap-2 text-sm text-foreground"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{benefit}</p>)}
              </div>
              <div className="mt-7">
                {isRed ? <Link href="/contact" className="flex min-h-11 w-full items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:bg-accent">Hablar con Vive Loja</Link> : isCurrent ? <span className="flex min-h-11 items-center justify-center rounded-xl bg-secondary px-4 text-sm font-semibold text-muted-foreground">Plan actual</span> : status === 'authenticated' ? <button type="button" disabled={isPending || !catalog.simulation.enabled} onClick={() => activate(plan.slug)} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{isPending && <Loader2 className="h-4 w-4 animate-spin" />}{catalog.simulation.enabled ? 'Activar beta sin costo' : 'Activación pausada'}</button> : <Link href="/auth/signin?callbackUrl=/planes" className="flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">Inicia sesión para activar</Link>}
              </div>
            </article>
          )
        })}
      </div>

      <div className="mx-auto max-w-3xl rounded-2xl border border-border/60 bg-secondary/50 px-5 py-4 text-center text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">{catalog.simulation.label}</p>
        <p className="mt-1">Precio comercial de referencia · total cobrado {money(catalog.simulation.chargedAmount)} · sin tarjeta · sin renovación automática.</p>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import { useSession } from 'next-auth/react'
import { Check, ChevronDown, Loader2, Mail, Sparkles, X } from 'lucide-react'
import { activatePlanAction } from '@/actions/billing/checkout'

type Capabilities = {
  maxLocations: number | null
  maxMembers: number | null
  maxMediaPerVenue: number | null
  googlePhotoEnabled: boolean
  menuEnabled: boolean
  servicesEnabled: boolean
  monthlyEventsPerVenue: number | null
  maxActivePromotionsPerVenue: number | null
  analyticsRetentionDays: number | null
  whatsappEnabled: boolean
  messagingEnabled: boolean
  reservationsEnabled: boolean
  priorityModeration: boolean
  includedBoostCredits: number
  eventTicketingEnabled?: boolean
  seatMapsEnabled?: boolean
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

const money = (value = 0) => new Intl.NumberFormat('es-EC', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
}).format(value)

const count = (value: number | null | undefined, singular: string, plural = `${singular}s`) => value === null || value === undefined ? 'A medida' : `${value} ${value === 1 ? singular : plural}`

function priceLabel(plan: CatalogPlan, cycle: 'MONTHLY' | 'ANNUAL') {
  if (plan.slug === 'enterprise') return 'A medida'
  const price = cycle === 'ANNUAL' ? plan.annualPrice : plan.monthlyPrice
  return `${money(price)} / ${cycle === 'ANNUAL' ? 'año' : 'mes'}`
}

function benefitLines(plan: CatalogPlan) {
  const c = plan.capabilities
  if (!c) return []
  return [
    count(c.maxLocations, 'ubicación', 'ubicaciones'),
    count(c.maxMembers, 'miembro', 'miembros'),
    c.maxMediaPerVenue === null ? 'Multimedia a medida' : `${c.maxMediaPerVenue} archivos multimedia por local`,
    c.menuEnabled ? 'Menú y productos' : 'Ficha esencial del local',
    c.monthlyEventsPerVenue === null ? 'Eventos sin límite de ciclo' : `${c.monthlyEventsPerVenue} eventos por local al mes`,
    c.maxActivePromotionsPerVenue === null ? 'Promociones a medida' : `${c.maxActivePromotionsPerVenue} promociones activas`,
    c.analyticsRetentionDays ? `Analytics de ${c.analyticsRetentionDays} días` : c.analyticsRetentionDays === null && plan.slug !== 'free' ? 'Analytics histórico' : 'Resumen de presencia',
    c.whatsappEnabled ? 'WhatsApp y contacto directo' : 'Contacto básico',
    c.reservationsEnabled ? 'Mensajes y reservas completas' : c.messagingEnabled ? 'Mensajes básicos' : 'Preguntas y reseñas',
  ]
}

const comparisonRows = [
  { label: 'Ubicaciones', get: (c: Capabilities) => count(c.maxLocations, 'local', 'locales') },
  { label: 'Miembros del equipo', get: (c: Capabilities) => count(c.maxMembers, 'miembro', 'miembros') },
  { label: 'Multimedia por local', get: (c: Capabilities) => c.maxMediaPerVenue === null ? 'A medida' : `${c.maxMediaPerVenue} archivos` },
  { label: 'Foto principal de Google', get: (c: Capabilities) => c.googlePhotoEnabled ? 'Incluida' : 'No incluida' },
  { label: 'Servicios', get: (c: Capabilities) => c.servicesEnabled ? 'Incluidos' : 'No incluidos' },
  { label: 'Menú y productos', get: (c: Capabilities) => c.menuEnabled ? 'Incluido' : 'No incluido' },
  { label: 'Eventos por local / mes', get: (c: Capabilities) => c.monthlyEventsPerVenue === null ? 'Sin límite' : c.monthlyEventsPerVenue === 0 ? 'No incluido' : `${c.monthlyEventsPerVenue}` },
  { label: 'Promociones activas', get: (c: Capabilities) => c.maxActivePromotionsPerVenue === null ? 'A medida' : c.maxActivePromotionsPerVenue === 0 ? 'No incluido' : `${c.maxActivePromotionsPerVenue}` },
  { label: 'Analytics', get: (c: Capabilities, planSlug?: string) => c.analyticsRetentionDays === null ? planSlug === 'free' ? 'Resumen' : 'Histórico' : c.analyticsRetentionDays ? `${c.analyticsRetentionDays} días` : 'Resumen' },
  { label: 'WhatsApp', get: (c: Capabilities) => c.whatsappEnabled ? 'Incluido' : 'No incluido' },
  { label: 'Mensajes', get: (c: Capabilities) => c.messagingEnabled ? 'Incluidos' : 'No incluidos' },
  { label: 'Reservas', get: (c: Capabilities) => c.reservationsEnabled ? 'Incluidas' : 'No incluidas' },
  { label: 'Entradas para eventos', get: (c: Capabilities) => c.eventTicketingEnabled ? 'Incluidas' : 'No incluidas' },
  { label: 'Mapas de asientos', get: (c: Capabilities) => c.seatMapsEnabled ? 'Incluidos' : 'No incluidos' },
  { label: 'Créditos de destacado', get: (c: Capabilities) => c.includedBoostCredits ? `${c.includedBoostCredits}` : 'No incluidos' },
  { label: 'Moderación prioritaria', get: (c: Capabilities) => c.priorityModeration ? 'Incluida' : 'No incluida' },
]

function businessPath(path: 'signup' | 'signin', plan: CatalogPlan, cycle: 'MONTHLY' | 'ANNUAL') {
  const params = new URLSearchParams({ intent: 'business', plan: plan.slug, cycle })
  return `/auth/${path}?${params.toString()}`
}

export function PricingCards({ catalog, currentSlug, showComparison = false }: { catalog: Catalog; currentSlug?: string | null; showComparison?: boolean }) {
  const { status } = useSession()
  const [cycle, setCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY')
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<CatalogPlan | null>(null)

  useEffect(() => {
    if (!selectedPlan) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedPlan(null)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [selectedPlan])

  function activate(planSlug: string) {
    setMessage(null)
    startTransition(async () => {
      const result = await activatePlanAction({ planSlug, cycle, idempotencyKey: crypto.randomUUID(), device: 'web' })
      setMessage(result.success
        ? { text: 'Plan activado. Ya puedes publicar tu negocio desde tu dashboard.', success: true }
        : { text: result.error ?? 'No se pudo activar el plan.', success: false })
    })
  }

  function choose(plan: CatalogPlan) {
    if (status === 'authenticated') return activate(plan.slug)
    setSelectedPlan(plan)
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

      {message && <p role={message.success ? 'status' : 'alert'} className={`mx-auto max-w-xl rounded-xl px-4 py-3 text-center text-sm ${message.success ? 'border border-emerald-200 bg-emerald-50 text-emerald-800' : 'border border-destructive/30 bg-destructive/10 text-destructive'}`}>{message.text}{message.success && <> <Link href="/dashboard/locales/crear" className="font-semibold underline">Publicar mi local</Link></>}</p>}

      <div className="grid gap-4 lg:grid-cols-4">
        {catalog.plans.map((plan) => {
          const isCurrent = currentSlug === plan.slug
          const isPro = plan.slug === 'pro'
          const isEnterprise = plan.slug === 'enterprise'
          return (
            <article key={plan.slug} className={`relative flex flex-col rounded-[1.5rem] border bg-card p-6 transition-transform duration-200 hover:-translate-y-1 ${isPro ? 'border-primary/60 shadow-lg shadow-primary/10 ring-1 ring-primary/20' : 'border-border/70'}`}>
              {isPro && <span className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground"><Sparkles className="h-3 w-3" /> Más elegido</span>}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{plan.name}</p>
                <h2 className="text-3xl font-medium">{priceLabel(plan, cycle)}</h2>
                <p className="min-h-10 text-sm text-muted-foreground">{isEnterprise ? 'Diseñado contigo para una red de locales.' : plan.description}</p>
              </div>
              <div className="mt-6 flex-1 space-y-3 border-t border-border/60 pt-5">
                {benefitLines(plan).map((benefit) => <p key={benefit} className="flex gap-2 text-sm text-foreground"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{benefit}</p>)}
              </div>
              <div className="mt-7">
                {isEnterprise ? <Link href="/contact?plan=enterprise" className="flex min-h-11 w-full items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:bg-accent">Hablar con Vive Loja</Link> : isCurrent ? <span className="flex min-h-11 items-center justify-center rounded-xl bg-secondary px-4 text-sm font-semibold text-muted-foreground">Plan actual</span> : <button type="button" disabled={isPending || !catalog.simulation.enabled} onClick={() => choose(plan)} className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">{isPending && <Loader2 className="h-4 w-4 animate-spin" />}{catalog.simulation.enabled ? (status === 'authenticated' ? 'Elegir plan · beta $0' : 'Continuar para publicar') : 'Activación pausada'}</button>}
              </div>
            </article>
          )
        })}
      </div>

      <div className="mx-auto max-w-3xl rounded-2xl border border-border/60 bg-secondary/50 px-5 py-4 text-center text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">{catalog.simulation.label}</p>
        <p className="mt-1">Precio comercial de referencia · total cobrado {money(catalog.simulation.chargedAmount)} · sin tarjeta · sin renovación automática.</p>
      </div>

      {showComparison && <section className="space-y-4" aria-labelledby="comparison-title">
        <div className="flex items-end justify-between gap-4"><div><p className="eyebrow text-primary">Todo claro antes de elegir</p><h2 id="comparison-title" className="mt-2 text-2xl font-semibold sm:text-3xl">Compara lo que incluye cada plan</h2></div><ChevronDown className="hidden h-5 w-5 text-muted-foreground sm:block" /></div>
        <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead><tr className="border-b border-border/70 bg-secondary/50"><th className="w-[28%] px-4 py-4 text-left font-semibold text-foreground">Funcionalidad</th>{catalog.plans.map((plan) => <th key={plan.slug} className={`px-4 py-4 text-left font-semibold ${plan.slug === 'pro' ? 'text-primary' : 'text-foreground'}`}>{plan.name}</th>)}</tr></thead>
            <tbody>{comparisonRows.map((row) => <tr key={row.label} className="border-b border-border/50 last:border-0"><th className="px-4 py-3 text-left font-medium text-muted-foreground">{row.label}</th>{catalog.plans.map((plan) => <td key={plan.slug} className={`px-4 py-3 ${plan.slug === 'pro' ? 'bg-primary/[0.035] font-medium text-foreground' : 'text-muted-foreground'}`}>{plan.capabilities ? row.get(plan.capabilities, plan.slug) : '—'}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </section>}

      {selectedPlan && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="checkout-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedPlan(null) }}>
        <div className="w-full max-w-lg rounded-t-[2rem] border border-border bg-background p-6 shadow-2xl sm:rounded-[2rem] sm:p-8">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Publicar tu negocio</p><h2 id="checkout-title" className="mt-2 text-2xl font-semibold">Plan {selectedPlan.name}</h2><p className="mt-2 text-sm text-muted-foreground">Elige este plan y después crea tu acceso. No pedimos tarjeta durante la beta.</p></div><button type="button" onClick={() => setSelectedPlan(null)} className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border hover:bg-secondary" aria-label="Cerrar selección"><X className="h-5 w-5" /></button></div>
          <div className="mt-6 space-y-3 rounded-2xl border border-border/70 bg-card p-4 text-sm"><div className="flex items-center justify-between"><span className="text-muted-foreground">Ciclo</span><span className="font-semibold">{cycle === 'ANNUAL' ? 'Anual' : 'Mensual'}</span></div><div className="flex items-center justify-between"><span className="text-muted-foreground">Total durante la beta</span><span className="font-semibold text-emerald-700">$0 · sin renovación</span></div><div className="flex items-start gap-2 border-t border-border/60 pt-3 text-muted-foreground"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Te enviaremos el código de verificación y, al activar, la confirmación del plan.</div></div>
          <div className="mt-6 space-y-3"><Link href={businessPath('signup', selectedPlan, cycle)} className="flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-4 font-semibold text-primary-foreground transition-opacity hover:opacity-90">Crear acceso para publicar</Link><Link href={businessPath('signin', selectedPlan, cycle)} className="flex min-h-11 w-full items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-accent">Ya tengo cuenta</Link></div>
        </div>
      </div>}
    </div>
  )
}

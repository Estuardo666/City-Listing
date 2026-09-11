'use client'

import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { Check, Loader2, Lock, Mail, Sparkles, User, X } from 'lucide-react'
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
  const [selectedPlan, setSelectedPlan] = useState<CatalogPlan | null>(null)

  useEffect(() => {
    if (!selectedPlan) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedPlan(null)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [selectedPlan])
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authPending, setAuthPending] = useState(false)

  function activate(planSlug: string) {
    setMessage(null)
    startTransition(async () => {
      const result = await activatePlanAction({ planSlug, cycle, idempotencyKey: crypto.randomUUID(), device: 'web' })
      setMessage(result.success ? 'Plan activado. Tu dashboard ya está actualizado.' : result.error ?? 'No se pudo activar el plan.')
    })
  }

  function choose(plan: CatalogPlan) {
    if (status === 'authenticated') return activate(plan.slug)
    setAuthError(null)
    setSelectedPlan(plan)
  }

  async function finishAccountAndCheckout() {
    if (!selectedPlan || !email.trim() || password.length < 6 || !accepted || (authMode === 'register' && !name.trim())) return
    setAuthPending(true)
    setAuthError(null)
    try {
      if (authMode === 'register') {
        const response = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }) })
        const payload = await response.json()
        if (!response.ok) {
          if (response.status === 409) setAuthMode('login')
          setAuthError(payload.error ?? 'No se pudo crear tu cuenta.')
          return
        }
      }
      const login = await signIn('credentials', { email: email.trim().toLowerCase(), password, redirect: false })
      if (login?.error) { setAuthError('El correo o la contraseña no coinciden.'); return }
      const planSlug = selectedPlan.slug
      setSelectedPlan(null)
      activate(planSlug)
    } catch {
      setAuthError('No pudimos conectar. Inténtalo nuevamente.')
    } finally {
      setAuthPending(false)
    }
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
                {isRed ? <Link href="/contact" className="flex min-h-11 w-full items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:bg-accent">Solicitar plan Red</Link> : isCurrent ? <span className="flex min-h-11 items-center justify-center rounded-xl bg-secondary px-4 text-sm font-semibold text-muted-foreground">Plan actual</span> : <button type="button" disabled={isPending || !catalog.simulation.enabled} onClick={() => choose(plan)} className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">{isPending && <Loader2 className="h-4 w-4 animate-spin" />}{catalog.simulation.enabled ? (status === 'authenticated' ? 'Elegir plan · beta $0' : 'Continuar con este plan') : 'Activación pausada'}</button>}
              </div>
            </article>
          )
        })}
      </div>

      <div className="mx-auto max-w-3xl rounded-2xl border border-border/60 bg-secondary/50 px-5 py-4 text-center text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">{catalog.simulation.label}</p>
        <p className="mt-1">Precio comercial de referencia · total cobrado {money(catalog.simulation.chargedAmount)} · sin tarjeta · sin renovación automática.</p>
      </div>

      {selectedPlan && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="checkout-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedPlan(null) }}>
        <div className="w-full max-w-lg rounded-t-[2rem] border border-border bg-background p-6 shadow-2xl sm:rounded-[2rem] sm:p-8">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Último paso</p><h2 id="checkout-title" className="mt-2 text-2xl font-semibold">{selectedPlan.name} · {money(cycle === 'ANNUAL' ? selectedPlan.annualPrice : selectedPlan.monthlyPrice)}</h2><p className="mt-1 text-sm text-muted-foreground">Crea tu acceso o entra con tu cuenta. Conservaremos el plan que elegiste.</p></div><button type="button" onClick={() => setSelectedPlan(null)} className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border hover:bg-secondary" aria-label="Cerrar checkout"><X className="h-5 w-5" /></button></div>
          <div className="mt-6 grid grid-cols-2 rounded-xl bg-secondary p-1"><button type="button" onClick={() => { setAuthMode('register'); setAuthError(null) }} className={`min-h-11 cursor-pointer rounded-lg text-sm font-semibold ${authMode === 'register' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>Soy nuevo</button><button type="button" onClick={() => { setAuthMode('login'); setAuthError(null) }} className={`min-h-11 cursor-pointer rounded-lg text-sm font-semibold ${authMode === 'login' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>Ya tengo cuenta</button></div>
          <div className="mt-5 space-y-4">{authMode === 'register' && <label className="block text-sm font-medium">Nombre completo<div className="relative mt-1.5"><User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground"/><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="min-h-11 w-full rounded-xl border bg-background pl-10 pr-3 text-base" /></div></label>}<label className="block text-sm font-medium">Correo electrónico<div className="relative mt-1.5"><Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground"/><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="min-h-11 w-full rounded-xl border bg-background pl-10 pr-3 text-base" /></div></label><label className="block text-sm font-medium">Contraseña<div className="relative mt-1.5"><Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground"/><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} className="min-h-11 w-full rounded-xl border bg-background pl-10 pr-3 text-base" /></div><span className="mt-1 block text-xs text-muted-foreground">Mínimo 6 caracteres.</span></label>
            <label className="flex cursor-pointer items-start gap-3 text-sm text-muted-foreground"><input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1 h-4 w-4"/><span>Acepto los <Link href="/terminos" target="_blank" className="font-medium text-foreground underline">términos</Link>, la <Link href="/privacy" target="_blank" className="font-medium text-foreground underline">privacidad</Link> y la <Link href="/reembolsos" target="_blank" className="font-medium text-foreground underline">política de reembolsos</Link>.</span></label>
            {authError && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{authError}</p>}
            <button type="button" onClick={finishAccountAndCheckout} disabled={authPending || !accepted || !email.trim() || password.length < 6 || (authMode === 'register' && !name.trim())} className="flex min-h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-primary px-4 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">{authPending ? <Loader2 className="h-5 w-5 animate-spin"/> : authMode === 'register' ? 'Crear cuenta y activar plan' : 'Entrar y activar plan'}</button>
          </div>
        </div>
      </div>}
    </div>
  )
}

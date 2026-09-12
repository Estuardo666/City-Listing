'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Check, Loader2, Mail, Store } from 'lucide-react'
import { activatePlanAction } from '@/actions/billing/checkout'

type BusinessPlanActivationProps = {
  planSlug: string
  cycle: 'MONTHLY' | 'ANNUAL'
}

const planNames: Record<string, string> = {
  free: 'Gratis',
  plus: 'Plus',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

export function BusinessPlanActivation({ planSlug, cycle }: BusinessPlanActivationProps) {
  const idempotencyKey = useRef<string>()
  const [pending, setPending] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activated, setActivated] = useState(false)

  async function activate() {
    if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID()
    setPending(true)
    setError(null)
    const result = await activatePlanAction({ planSlug, cycle, idempotencyKey: idempotencyKey.current, device: 'web' })
    if (result.success) setActivated(true)
    else setError(result.error ?? 'No pudimos activar el plan.')
    setPending(false)
  }

  useEffect(() => {
    void activate()
    // The idempotency key keeps React Strict Mode and manual retries safe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const planName = planNames[planSlug] ?? planSlug

  return (
    <main className="min-h-[70vh] px-4 py-16 sm:py-24">
      <section className="mx-auto max-w-xl space-y-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {pending ? <Loader2 className="h-7 w-7 animate-spin" /> : activated ? <Check className="h-8 w-8" /> : <Store className="h-8 w-8" />}
        </div>
        <div className="space-y-3">
          <p className="eyebrow text-primary">Publicar mi negocio</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">{pending ? 'Activando tu plan…' : activated ? 'Tu plan ya está activo' : 'No pudimos activar tu plan'}</h1>
          <p className="text-muted-foreground">
            {pending ? `Estamos preparando tu cuenta empresarial con el plan ${planName}.` : activated ? 'No tienes que pasar por el onboarding de intereses. Ya puedes comenzar con la ficha de tu local.' : error}
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-5 text-left shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Plan elegido</p>
              <p className="mt-1 text-xl font-semibold">{planName}</p>
            </div>
            <p className="rounded-full bg-secondary px-3 py-1 text-sm font-medium">{cycle === 'ANNUAL' ? 'Anual' : 'Mensual'}</p>
          </div>
          <div className="mt-5 flex items-start gap-3 border-t border-border/60 pt-4 text-sm text-muted-foreground">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>Te enviaremos la confirmación a tu correo. Durante la beta el total cobrado es $0 y no hay renovación automática.</span>
          </div>
        </div>

        {activated ? (
          <Link href="/dashboard/locales/crear" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-5 font-semibold text-primary-foreground transition-opacity hover:opacity-90">
            Publicar mi local
          </Link>
        ) : !pending ? (
          <button type="button" onClick={() => void activate()} className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-5 font-semibold text-primary-foreground transition-opacity hover:opacity-90">
            Intentar de nuevo
          </button>
        ) : null}
      </section>
    </main>
  )
}

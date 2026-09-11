import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPublishedCatalog } from '@/lib/billing/plans'
import { getBusinessAccountSnapshot } from '@/lib/billing/service'
import { PricingCards } from '@/components/billing/pricing-cards'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Mi plan — Dashboard' }

export default async function DashboardPlanPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/signin')
  const [catalog, snapshot] = await Promise.all([getPublishedCatalog(), getBusinessAccountSnapshot(session.user.id)])
  return (
    <div className="pb-20 pt-10">
      <section className="section-shell max-w-6xl space-y-8">
        <div className="space-y-2">
          <p className="eyebrow text-primary">Cuenta empresarial</p>
          <h1 className="text-3xl">Mi plan</h1>
          <p className="text-sm text-muted-foreground">{snapshot?.subscription ? `Vigente hasta ${snapshot.subscription.endsAt.toLocaleDateString('es-EC')}` : 'Activa una opción para ampliar tu presencia.'} · Sin renovación automática.</p>
        </div>
        {snapshot && <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-border/60 bg-card p-4"><p className="text-xs text-muted-foreground">Plan efectivo</p><p className="mt-1 text-xl font-semibold">{snapshot.plan.name}</p><p className="text-xs text-muted-foreground">{snapshot.plan.source === 'ADMIN_OVERRIDE' ? 'Asignado por Vive Loja' : 'Heredado por la cuenta'}</p></div><div className="rounded-2xl border border-border/60 bg-card p-4"><p className="text-xs text-muted-foreground">Ubicaciones</p><p className="mt-1 text-xl font-semibold">{snapshot.usage.locations.used} / {snapshot.usage.locations.limit ?? '∞'}</p></div><div className="rounded-2xl border border-border/60 bg-card p-4"><p className="text-xs text-muted-foreground">Miembros</p><p className="mt-1 text-xl font-semibold">{snapshot.usage.members.used} / {snapshot.usage.members.limit ?? '∞'}</p></div></div>}
        <PricingCards catalog={catalog} currentSlug={snapshot?.plan.slug} />
      </section>
    </div>
  )
}

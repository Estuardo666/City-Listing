import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ensureInitialCatalog, resolveEffectivePlan } from '@/lib/billing/plans'
import { prisma } from '@/lib/prisma'
import { AdminBillingPanel } from '@/components/billing/admin-billing-panel'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Monetización — Administración' }

export default async function AdminMonetizationPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'ADMIN') return <div className="p-8 text-center text-muted-foreground">No autorizado</div>
  await ensureInitialCatalog()
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const previousMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
  const [plans, addons, accounts, venues, setting, googleUsage, previousGoogleUsage, topGoogleVenues, orders, deliveries, audit] = await Promise.all([
    prisma.plan.findMany({ orderBy: { displayOrder: 'asc' }, include: { versions: { where: { isPublished: true }, orderBy: { version: 'desc' }, take: 1 } } }),
    prisma.addonProduct.findMany({ orderBy: { displayOrder: 'asc' } }),
    prisma.businessAccount.findMany({ orderBy: { createdAt: 'asc' }, select: { id: true, owner: { select: { name: true, email: true } }, _count: { select: { venues: true, memberships: true } }, subscriptions: { where: { status: 'ACTIVE', startsAt: { lte: now }, endsAt: { gt: now } }, orderBy: { startsAt: 'desc' }, take: 1, select: { planVersion: { select: { plan: { select: { slug: true } } } } } } } }),
    prisma.venue.findMany({ orderBy: { name: 'asc' }, take: 300, select: { id: true, name: true, businessAccountId: true, planOverrides: { where: { status: 'ACTIVE', startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] }, orderBy: { startsAt: 'desc' }, take: 1, select: { planVersion: { select: { plan: { select: { slug: true } } } } } } } }),
    prisma.billingSetting.findUnique({ where: { id: 'global' }, select: { simulationEnabled: true, googlePhotoEnabled: true } }),
    prisma.googlePlaceUsage.aggregate({ where: { bucket: 'MONTHLY', periodStart: monthStart }, _sum: { requests: true, successes: true, errors: true, quotaErrors: true } }),
    prisma.googlePlaceUsage.aggregate({ where: { bucket: 'MONTHLY', periodStart: previousMonthStart }, _sum: { requests: true, successes: true, errors: true, quotaErrors: true } }),
    prisma.googlePlaceUsage.findMany({ where: { bucket: 'MONTHLY', periodStart: monthStart, venueId: { not: null } }, orderBy: { requests: 'desc' }, take: 10, select: { requests: true, successes: true, errors: true, venue: { select: { name: true } } } }),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 40, select: { id: true, kind: true, status: true, referenceAmount: true, chargedAmount: true, currency: true, createdAt: true, buyer: { select: { email: true } }, planVersion: { select: { plan: { select: { name: true } } } }, addonProduct: { select: { name: true } } } }),
    prisma.addonPurchase.findMany({ where: { deliveryStatus: { in: ['PENDING', 'IN_PROGRESS'] } }, orderBy: { createdAt: 'asc' }, select: { id: true, deliveryStatus: true, createdAt: true, addonProduct: { select: { name: true } }, buyer: { select: { email: true } }, venue: { select: { name: true } } } }),
    prisma.billingAuditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50, select: { id: true, action: true, reason: true, createdAt: true, actor: { select: { email: true } }, account: { select: { name: true } }, venue: { select: { name: true } } } }),
  ])
  const venuePlans = await Promise.all(venues.map(async (venue) => ({ id: venue.id, name: venue.name, accountId: venue.businessAccountId, inheritedPlan: (await resolveEffectivePlan(venue.id)).slug, overridePlan: venue.planOverrides[0]?.planVersion.plan.slug ?? null })))
  const sum = (value: typeof googleUsage) => ({ requests: value._sum.requests ?? 0, successes: value._sum.successes ?? 0, errors: value._sum.errors ?? 0, quotaErrors: value._sum.quotaErrors ?? 0 })
  return <div className="pb-16 pt-8"><section className="section-shell max-w-7xl space-y-8">
    <div><p className="eyebrow text-primary">Administración transversal</p><h1 className="text-3xl">Monetización</h1><p className="mt-1 text-sm text-muted-foreground">Catálogo versionado, activaciones beta, extras, entregas y auditoría.</p></div>
    <AdminBillingPanel
      plans={plans.map(({ versions, ...plan }) => ({ ...plan, latest: versions[0] ?? null }))} addons={addons}
      accounts={accounts.map((account) => ({ id: account.id, owner: account.owner, activePlan: account.subscriptions[0]?.planVersion.plan.slug ?? 'free', venues: account._count.venues, members: account._count.memberships }))}
      venues={venuePlans} simulationEnabled={setting?.simulationEnabled ?? true} googlePhotoEnabled={setting?.googlePhotoEnabled ?? true}
      google={{ current: sum(googleUsage), previous: sum(previousGoogleUsage), topVenues: topGoogleVenues.map((item) => ({ name: item.venue?.name ?? 'Local eliminado', requests: item.requests, successes: item.successes, errors: item.errors })) }}
      orders={orders.map((order) => ({ ...order, createdAt: order.createdAt.toISOString(), product: order.planVersion?.plan.name ?? order.addonProduct?.name ?? 'Sin producto' }))}
      deliveries={deliveries.map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), venue: item.venue?.name ?? null }))}
      audit={audit.map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), account: item.account?.name ?? null, venue: item.venue?.name ?? null }))}
    />
  </section></div>
}

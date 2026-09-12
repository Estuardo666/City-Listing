import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { BusinessPlanActivation } from '@/components/billing/business-plan-activation'

const validPlans = new Set(['free', 'plus', 'pro', 'enterprise'])

function selectionPath(plan: string, cycle: string) {
  return `/auth/signin?intent=business&plan=${encodeURIComponent(plan)}&cycle=${encodeURIComponent(cycle)}`
}

export default async function ActivateBusinessPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string; plan?: string; cycle?: string }>
}) {
  const params = await searchParams
  const plan = params.plan ?? ''
  const cycle = params.cycle === 'ANNUAL' ? 'ANNUAL' : params.cycle === 'MONTHLY' ? 'MONTHLY' : null
  const session = await getServerSession(authOptions)

  if (params.intent !== 'business' || !validPlans.has(plan) || !cycle) redirect('/planes')
  if (!session?.user?.id) redirect(selectionPath(plan, cycle))

  if (plan === 'enterprise') redirect('/contact?plan=enterprise')

  return <BusinessPlanActivation planSlug={plan} cycle={cycle} />
}

import { CheckoutResultClient } from '@/components/features/ticketing/checkout-result-client'

export const dynamic = 'force-dynamic'

type CheckoutResultPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

export default async function CheckoutResultPage({ searchParams }: CheckoutResultPageProps) {
  const params = await searchParams
  return <CheckoutResultClient token={first(params.token)} clientTransactionId={first(params.clientTransactionId)} statusParam={first(params.status)} />
}

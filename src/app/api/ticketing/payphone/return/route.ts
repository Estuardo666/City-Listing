import { NextResponse } from 'next/server'
import { confirmTicketPayment } from '@/lib/ticketing'
import { payphoneReturnStatus } from '@/lib/ticketing/provider/payphone'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const clientTransactionId = url.searchParams.get('clientTransactionId') ?? ''
  const transactionId = url.searchParams.get('id') ?? ''
  const token = url.searchParams.get('token') ?? ''
  const resultQuery = new URLSearchParams()
  if (token) resultQuery.set('token', token)
  if (clientTransactionId) resultQuery.set('clientTransactionId', clientTransactionId)
  try {
    if (!clientTransactionId || !/^\d+$/.test(transactionId)) {
      resultQuery.set('status', 'failed')
      return NextResponse.redirect(new URL(`/checkout/result?${resultQuery.toString()}`, url.origin))
    }
    await confirmTicketPayment(clientTransactionId, transactionId)
    resultQuery.set('status', 'paid')
    return NextResponse.redirect(new URL(`/checkout/result?${resultQuery.toString()}`, url.origin))
  } catch (error) {
    console.error('[ticketing] PayPhone return failed', error)
    resultQuery.set('status', payphoneReturnStatus(error))
    return NextResponse.redirect(new URL(`/checkout/result?${resultQuery.toString()}`, url.origin))
  }
}

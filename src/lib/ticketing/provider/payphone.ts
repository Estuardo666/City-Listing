import { isTicketingError, TicketingError, TICKETING_ERROR_CODES } from '../constants'

const PAYPHONE_API = 'https://pay.payphonetodoesposible.com/api'

export type PayphoneCredentials = { token: string; storeId: string }

export type NormalizedPayphonePayment = {
  approved: boolean
  clientTransactionId: string
  transactionId: string | null
  amountCents: number | null
  currency: string | null
  status: string
  statusCode: number | null
  raw: Record<string, unknown>
}

function providerDiagnostics(payload: unknown) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {}
  const value = payload as Record<string, unknown>
  const errorCode = typeof value.errorCode === 'number' || typeof value.errorCode === 'string'
    ? value.errorCode
    : typeof value.ErrorCode === 'number' || typeof value.ErrorCode === 'string'
      ? value.ErrorCode
      : undefined
  const message = typeof value.message === 'string' ? value.message.slice(0, 160) : undefined
  const errors = Array.isArray(value.errors)
    ? value.errors.slice(0, 3).map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null
      const error = item as Record<string, unknown>
      const descriptions = Array.isArray(error.errorDescriptions)
        ? error.errorDescriptions.filter((description): description is string => typeof description === 'string').slice(0, 2).map((description) => description.slice(0, 160))
        : []
      return { message: typeof error.message === 'string' ? error.message.slice(0, 80) : undefined, descriptions }
    }).filter((item): item is { message: string | undefined; descriptions: string[] } => item !== null)
    : undefined
  return {
    ...(errorCode !== undefined ? { providerErrorCode: errorCode } : {}),
    ...(message ? { providerMessage: message } : {}),
    ...(errors?.length ? { providerErrors: errors } : {}),
  }
}

export function normalizePayphonePhone(value: string) {
  const compact = value.trim().replace(/[\s().-]/g, '')
  const digits = compact.replace(/^\+/, '')
  const national = digits.startsWith('593') ? digits.slice(3) : digits.startsWith('0') ? digits.slice(1) : digits
  const isMobile = /^9\d{8}$/.test(national)
  const isFixedLine = /^[2-7]\d{7}$/.test(national)
  if (!isMobile && !isFixedLine) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, 'Ingresa un teléfono ecuatoriano válido, por ejemplo 0999999999 o +593999999999.', 400)
  return `+593${national}`
}

export function safePayphoneCheckoutUrl(value: unknown) {
  if (typeof value !== 'string' || !value) return null
  try {
    const url = new URL(value)
    if (
      url.protocol !== 'https:'
      || url.username
      || url.password
      || url.hostname !== 'pay.payphonetodoesposible.com'
      || !['/Anonymous/Index', '/PayPhone/Index'].includes(url.pathname)
    ) return null
    return url.toString()
  } catch {
    return null
  }
}

export function payphoneRedirectDocument(checkoutUrl: string) {
  const safeUrl = safePayphoneCheckoutUrl(checkoutUrl)
  if (!safeUrl) throw new TicketingError(TICKETING_ERROR_CODES.PROVIDER_ERROR, 'El enlace de pago de PayPhone no es válido.', 502)
  const scriptUrl = JSON.stringify(safeUrl).replace(/</g, '\\u003c')
  const href = safeUrl.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="referrer" content="origin">
  <title>Abriendo PayPhone…</title>
</head>
<body>
  <p>Abriendo el pago seguro de PayPhone…</p>
  <p><a href="${href}">Continuar al pago</a></p>
  <script>window.location.replace(${scriptUrl})</script>
</body>
</html>`
}

async function post(path: string, credentials: PayphoneCredentials, body: unknown): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(`${PAYPHONE_API}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credentials.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12_000),
    })
  } catch (error) {
    throw new TicketingError(TICKETING_ERROR_CODES.PROVIDER_ERROR, 'PayPhone no respondió.', 502, { cause: String(error) })
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok || payload === null || payload === undefined) {
    const diagnostics = providerDiagnostics(payload)
    console.error('[ticketing] PayPhone rejected request', { path, providerStatus: response.status, ...diagnostics })
    throw new TicketingError(TICKETING_ERROR_CODES.PROVIDER_ERROR, 'PayPhone rechazó la solicitud.', 502, { providerStatus: response.status, ...diagnostics })
  }
  return payload
}

export async function preparePayphoneCheckout(input: {
  credentials: PayphoneCredentials
  clientTransactionId: string
  amountCents: number
  reference: string
  responseUrl: string
  cancellationUrl: string
  buyer: { name: string; email: string; phone: string; documentId?: string | null }
  lineItems: Array<{ name: string; unitPriceCents: number; quantity: number; totalCents: number; sku: string }>
}) {
  const [firstName, ...lastNameParts] = input.buyer.name.trim().split(/\s+/)
  const lastName = lastNameParts.join(' ') || firstName
  const response = await post('/button/Prepare', input.credentials, {
    amount: input.amountCents,
    amountWithoutTax: input.amountCents,
    amountWithTax: 0,
    tax: 0,
    service: 0,
    tip: 0,
    clientTransactionId: input.clientTransactionId,
    reference: input.reference.slice(0, 120),
    storeId: input.credentials.storeId,
    currency: 'USD',
    responseUrl: input.responseUrl,
    cancellationUrl: input.cancellationUrl,
    timeZone: -5,
    email: input.buyer.email,
    phoneNumber: input.buyer.phone,
    documentId: input.buyer.documentId ?? null,
    order: {
      billTo: {
        country: 'EC',
        state: 'Loja',
        locality: 'Loja',
        firstName,
        lastName,
        phoneNumber: input.buyer.phone,
        email: input.buyer.email,
        customerId: input.clientTransactionId,
      },
      lineItems: input.lineItems.map((item) => ({
        productName: item.name,
        unitPrice: item.unitPriceCents,
        quantity: item.quantity,
        totalAmount: item.totalCents,
        taxAmount: 0,
        productSKU: item.sku,
        productDescription: 'Entrada para evento en Vive Loja',
      })),
    },
  })

  if (!response || typeof response !== 'object' || Array.isArray(response)) throw new TicketingError(TICKETING_ERROR_CODES.PROVIDER_ERROR, 'PayPhone no generó una sesión de pago.', 502)
  const payload = response as Record<string, unknown>
  if (typeof payload.paymentId !== 'number' && typeof payload.paymentId !== 'string') {
    const diagnostics = providerDiagnostics(payload)
    console.error('[ticketing] PayPhone did not create a checkout', diagnostics)
    throw new TicketingError(TICKETING_ERROR_CODES.PROVIDER_ERROR, 'PayPhone no generó una sesión de pago.', 502, diagnostics)
  }

  const payWithPayPhone = safePayphoneCheckoutUrl(payload.payWithPayPhone)
  const payWithCard = safePayphoneCheckoutUrl(payload.payWithCard)
  if (!payWithPayPhone && !payWithCard) throw new TicketingError(TICKETING_ERROR_CODES.PROVIDER_ERROR, 'PayPhone no generó un enlace seguro de pago.', 502)

  return {
    paymentId: String(payload.paymentId),
    payWithPayPhone,
    payWithCard,
    raw: payload,
  }
}

export async function confirmPayphonePayment(credentials: PayphoneCredentials, transactionId: string, clientTransactionId: string): Promise<NormalizedPayphonePayment> {
  if (!/^\d+$/.test(transactionId)) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, 'Referencia PayPhone inválida.', 400)
  const response = await post('/button/V2/Confirm', credentials, { id: Number(transactionId), clientTxId: clientTransactionId })
  if (!response || typeof response !== 'object' || Array.isArray(response)) throw new TicketingError(TICKETING_ERROR_CODES.PROVIDER_ERROR, 'PayPhone devolvió una respuesta inválida.', 502)
  const payload = response as Record<string, unknown>
  const statusCode = typeof payload.statusCode === 'number' ? payload.statusCode : null
  const status = typeof payload.transactionStatus === 'string' ? payload.transactionStatus : 'Unknown'
  return {
    approved: statusCode === 3 && status.toLowerCase() === 'approved',
    clientTransactionId: typeof payload.clientTransactionId === 'string' ? payload.clientTransactionId : clientTransactionId,
    transactionId: payload.transactionId == null ? null : String(payload.transactionId),
    amountCents: typeof payload.amount === 'number' ? payload.amount : null,
    currency: typeof payload.currency === 'string' ? payload.currency : null,
    status,
    statusCode,
    raw: payload,
  }
}

export async function reversePayphonePayment(credentials: PayphoneCredentials, transactionId: string) {
  if (!/^\d+$/.test(transactionId)) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, 'Referencia PayPhone inválida.', 400)
  return post('/Reverse', credentials, { id: Number(transactionId) })
}

export function parsePayphoneNotification(payload: unknown): NormalizedPayphonePayment | null {
  if (!payload || typeof payload !== 'object') return null
  const value = payload as Record<string, unknown>
  const statusCode = typeof value.StatusCode === 'number' ? value.StatusCode : null
  const status = typeof value.TransactionStatus === 'string' ? value.TransactionStatus : 'Unknown'
  const clientTransactionId = typeof value.ClientTransactionId === 'string' ? value.ClientTransactionId : ''
  if (!clientTransactionId) return null
  return {
    approved: statusCode === 3 && status.toLowerCase() === 'approved',
    clientTransactionId,
    transactionId: value.TransactionId == null ? null : String(value.TransactionId),
    amountCents: typeof value.Amount === 'number' ? value.Amount : null,
    currency: typeof value.Currency === 'string' ? value.Currency : null,
    status,
    statusCode,
    raw: value,
  }
}

export function payphoneReturnStatus(error: unknown): 'failed' | 'pending' {
  return isTicketingError(error) && error.code === TICKETING_ERROR_CODES.PAYMENT_FAILED ? 'failed' : 'pending'
}

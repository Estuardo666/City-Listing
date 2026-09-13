import assert from 'node:assert/strict'
import test from 'node:test'
import { calculatePlatformFee, dollarsToCents } from '../src/lib/ticketing/money'
import { normalizePayphonePhone, parsePayphoneNotification, payphoneRedirectDocument, payphoneReturnStatus, preparePayphoneCheckout, safePayphoneCheckoutUrl } from '../src/lib/ticketing/provider/payphone'
import { TicketingError, TICKETING_ERROR_CODES } from '../src/lib/ticketing/constants'
import { createPublicToken, decryptSecret, encryptSecret } from '../src/lib/ticketing/secrets'
import { ticketScanUrl, ticketingBaseUrl } from '../src/lib/ticketing/links'
import { ticketCheckoutEntryUrl } from '../src/lib/ticketing/service'

test('ticketing money is calculated in integer cents', () => {
  assert.equal(dollarsToCents(12.34), 1234)
  assert.equal(calculatePlatformFee(10_000, 250, 35), 285)
  assert.equal(calculatePlatformFee(1, 5000, 0), 1)
  assert.throws(() => dollarsToCents(Number.NaN), /importe no es válido/i)
})

test('PayPhone notification parser only treats status code 3 as approved', () => {
  const approved = parsePayphoneNotification({ ClientTransactionId: 'vl_abc', TransactionId: 123, Amount: 2500, Currency: 'USD', StatusCode: 3, TransactionStatus: 'Approved' })
  assert.equal(approved?.approved, true)
  assert.equal(approved?.transactionId, '123')

  const rejected = parsePayphoneNotification({ ClientTransactionId: 'vl_abc', TransactionId: 123, Amount: 2500, Currency: 'USD', StatusCode: 2, TransactionStatus: 'Rejected' })
  assert.equal(rejected?.approved, false)
  assert.equal(parsePayphoneNotification({ StatusCode: 3 }), null)
})

test('PayPhone return marks a confirmed cancellation as failed, not pending', () => {
  assert.equal(payphoneReturnStatus(new TicketingError(TICKETING_ERROR_CODES.PAYMENT_FAILED, 'cancelled')), 'failed')
  assert.equal(payphoneReturnStatus(new TicketingError(TICKETING_ERROR_CODES.PROVIDER_ERROR, 'timeout')), 'pending')
})

test('PayPhone phone numbers are normalized to Ecuador E.164 format', () => {
  assert.equal(normalizePayphonePhone('0999999999'), '+593999999999')
  assert.equal(normalizePayphonePhone('+593 7 256 2378'), '+59372562378')
  assert.throws(() => normalizePayphonePhone('+593627689245'), /teléfono ecuatoriano válido/i)
})

test('ticketing credentials are encrypted and decryptable with the configured key', () => {
  const previous = process.env.TICKETING_CREDENTIAL_ENCRYPTION_KEY
  process.env.TICKETING_CREDENTIAL_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64')
  try {
    const token = createPublicToken()
    const encrypted = encryptSecret('payphone-secret-token')
    assert.notEqual(encrypted.ciphertext, 'payphone-secret-token')
    assert.equal(decryptSecret(encrypted), 'payphone-secret-token')
    assert.equal(token.hash.length, 64)
    assert.equal(token.last4, token.token.slice(-4))
  } finally {
    if (previous === undefined) delete process.env.TICKETING_CREDENTIAL_ENCRYPTION_KEY
    else process.env.TICKETING_CREDENTIAL_ENCRYPTION_KEY = previous
  }
})

test('PayPhone checkout rejects non-HTTPS provider links', async () => {
  const previousFetch = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({ paymentId: 123, payWithCard: 'javascript:alert(1)' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  try {
    await assert.rejects(
      preparePayphoneCheckout({
        credentials: { token: 'test-token', storeId: 'test-store' },
        clientTransactionId: 'vl_test',
        amountCents: 100,
        reference: 'Smoke test',
        responseUrl: 'https://viveloja.com/callback',
        cancellationUrl: 'https://viveloja.com/cancel',
        buyer: { name: 'Smoke Test', email: 'smoke@example.com', phone: '0999999999' },
        lineItems: [{ name: 'Entrada', unitPriceCents: 100, quantity: 1, totalCents: 100, sku: 'smoke' }],
      }),
      /enlace seguro/i,
    )
  } finally {
    globalThis.fetch = previousFetch
  }
})

test('PayPhone checkout only accepts official hosted payment forms', () => {
  assert.equal(
    safePayphoneCheckoutUrl('https://pay.payphonetodoesposible.com/Anonymous/Index?paymentId=payment-123'),
    'https://pay.payphonetodoesposible.com/Anonymous/Index?paymentId=payment-123',
  )
  assert.equal(safePayphoneCheckoutUrl('https://example.com/Anonymous/Index?paymentId=payment-123'), null)
  assert.equal(safePayphoneCheckoutUrl('https://pay.payphonetodoesposible.com/other'), null)
})

test('PayPhone redirect document establishes the authorized web origin before navigation', () => {
  const checkoutUrl = 'https://pay.payphonetodoesposible.com/Anonymous/Index?paymentId=payment-123&method=card'
  const document = payphoneRedirectDocument(checkoutUrl)
  assert.match(document, /<meta name="referrer" content="origin">/)
  assert.match(document, /window\.location\.replace\("https:\/\/pay\.payphonetodoesposible\.com\/Anonymous\/Index\?paymentId=payment-123&method=card"\)/)
  assert.match(document, /paymentId=payment-123&amp;method=card/)
  assert.throws(() => payphoneRedirectDocument('https://example.com/checkout'), /no es válido/i)
})

test('ticket checkout starts on the authorized Vive Loja web origin', () => {
  const previous = process.env.NEXT_PUBLIC_APP_URL
  process.env.NEXT_PUBLIC_APP_URL = 'https://viveloja.com'
  try {
    const token = 'private token/with symbols'
    const url = new URL(ticketCheckoutEntryUrl(token))
    assert.equal(url.origin, 'https://viveloja.com')
    assert.equal(url.pathname, '/checkout/payphone')
    assert.equal(url.searchParams.get('token'), token)
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_APP_URL
    else process.env.NEXT_PUBLIC_APP_URL = previous
  }
})

test('ticket QR encodes a scannable Vive Loja URL instead of the raw token', () => {
  const url = new URL(ticketScanUrl('private-ticket-token', 'https://viveloja.com'))
  assert.equal(url.origin, 'https://viveloja.com')
  assert.equal(url.pathname, '/tickets/scan')
  assert.equal(url.searchParams.get('token'), 'private-ticket-token')
})

test('ticket links fall back when the app URL contains pasted Markdown', () => {
  const malformed = '[https://viveloja.com](https://viveloja.com)\n\\a /api/ticketing/qr'
  assert.equal(ticketingBaseUrl(malformed), 'https://viveloja.com')
  assert.equal(new URL(ticketScanUrl('private-ticket-token', malformed)).href, 'https://viveloja.com/tickets/scan?token=private-ticket-token')
})

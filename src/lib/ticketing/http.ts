import { NextResponse } from 'next/server'
import { TicketingError } from './constants'

export function ticketingErrorResponse(error: unknown) {
  if (error instanceof TicketingError) return NextResponse.json({ error: { code: error.code, message: error.message, ...(error.context ? { context: error.context } : {}) } }, { status: error.status })
  console.error('[ticketing] unhandled error', error)
  return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Ocurrió un problema con la boletería.' } }, { status: 500 })
}

export async function withTicketingErrors(handler: (request: Request, ...args: unknown[]) => Promise<Response>, request: Request, ...args: unknown[]) {
  try { return await handler(request, ...args) } catch (error) { return ticketingErrorResponse(error) }
}

export function requireIdempotencyKey(request: Request) {
  const value = request.headers.get('idempotency-key')?.trim()
  if (!value || value.length < 8 || value.length > 120) throw new TicketingError('INVALID_INPUT', 'Falta una clave de idempotencia válida.')
  return value
}

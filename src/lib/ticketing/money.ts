import { TicketingError, TICKETING_ERROR_CODES } from './constants'

export function dollarsToCents(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, 'El importe no es válido.')
  }
  return Math.round(value * 100)
}

export function calculatePlatformFee(subtotalCents: number, percentBps: number, fixedCents: number): number {
  if (!Number.isInteger(subtotalCents) || subtotalCents < 0 || !Number.isInteger(percentBps) || percentBps < 0 || !Number.isInteger(fixedCents) || fixedCents < 0) {
    throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, 'La configuración de tarifa no es válida.')
  }
  return Math.floor((subtotalCents * percentBps + 5000) / 10000) + fixedCents
}

export function formatCents(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency }).format(cents / 100)
}

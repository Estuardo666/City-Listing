export const TICKETING_MODES = ['NONE', 'INTERNAL', 'EXTERNAL'] as const
export type TicketingMode = (typeof TICKETING_MODES)[number]

export const TICKET_KINDS = ['GENERAL', 'NUMBERED', 'ASSIGNED_SEAT'] as const
export type TicketKind = (typeof TICKET_KINDS)[number]

export const FEE_INCIDENCES = ['NONE', 'BUYER_PAYS', 'ORGANIZER_ABSORBS'] as const
export type FeeIncidence = (typeof FEE_INCIDENCES)[number]

export const DEFAULT_HOLD_MINUTES = 10
export const DEFAULT_MAX_TICKETS_PER_ORDER = 10
export const DEFAULT_CURRENCY = 'USD'

export const TICKETING_ERROR_CODES = {
  INVALID_INPUT: 'INVALID_INPUT',
  NOT_FOUND: 'NOT_FOUND',
  MODE_NOT_INTERNAL: 'MODE_NOT_INTERNAL',
  MODE_NOT_EXTERNAL: 'MODE_NOT_EXTERNAL',
  PLAN_REQUIRED: 'PLAN_REQUIRED',
  PAYMENT_ACCOUNT_REQUIRED: 'PAYMENT_ACCOUNT_REQUIRED',
  PAYMENT_ACCOUNT_INACTIVE: 'PAYMENT_ACCOUNT_INACTIVE',
  PAYMENT_NOT_CONFIGURED: 'PAYMENT_NOT_CONFIGURED',
  SALES_NOT_OPEN: 'SALES_NOT_OPEN',
  SOLD_OUT: 'SOLD_OUT',
  HOLD_EXPIRED: 'HOLD_EXPIRED',
  SEAT_UNAVAILABLE: 'SEAT_UNAVAILABLE',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  PAYMENT_MISMATCH: 'PAYMENT_MISMATCH',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  ALREADY_CHECKED_IN: 'ALREADY_CHECKED_IN',
  INVALID_TICKET: 'INVALID_TICKET',
  WRONG_EVENT: 'WRONG_EVENT',
  FORBIDDEN: 'FORBIDDEN',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  REFUND_NOT_AVAILABLE: 'REFUND_NOT_AVAILABLE',
} as const

export type TicketingErrorCode = (typeof TICKETING_ERROR_CODES)[keyof typeof TICKETING_ERROR_CODES]

export class TicketingError extends Error {
  readonly code: TicketingErrorCode
  readonly status: number
  readonly context?: Record<string, unknown>

  constructor(code: TicketingErrorCode, message: string, status = 400, context?: Record<string, unknown>) {
    super(message)
    this.name = 'TicketingError'
    this.code = code
    this.status = status
    this.context = context
  }
}

export function isTicketingError(error: unknown): error is TicketingError {
  return error instanceof TicketingError
}

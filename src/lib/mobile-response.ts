import { NextResponse } from 'next/server'

export function mobileSuccess<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ data, ...(meta ? { meta } : {}) })
}

export function mobileError(code: string, message: string, status = 400, fields?: Record<string, string[]>) {
  return NextResponse.json({ error: { code, message, ...(fields ? { fields } : {}) } }, { status })
}

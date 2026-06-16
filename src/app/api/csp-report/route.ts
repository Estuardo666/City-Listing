import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let report: unknown

    if (contentType.includes('application/csp-report') || contentType.includes('json')) {
      report = await request.json()
    } else {
      const text = await request.text()
      try {
        report = JSON.parse(text)
      } catch {
        report = { raw: text }
      }
    }

    console.warn('[CSP Violation]', JSON.stringify(report, null, 2))
  } catch {
    console.warn('[CSP Violation] Failed to parse report')
  }

  return new NextResponse(null, { status: 204 })
}

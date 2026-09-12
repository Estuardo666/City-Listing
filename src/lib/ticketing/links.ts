export function ticketScanUrl(token: string, baseUrl?: string) {
  const url = new URL('/tickets/scan', baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'https://viveloja.com')
  url.searchParams.set('token', token)
  return url.toString()
}

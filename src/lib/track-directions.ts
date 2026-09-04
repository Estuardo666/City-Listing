'use client'
export function trackDirections(kind: 'venue' | 'event' | 'route', itemId: string) {
  // Navigation never waits for telemetry, including offline and quota errors.
  void fetch('/api/mobile/v1/interactions', { method: 'POST', keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'directions', kind, itemId, source: 'web' }),
  }).catch(() => {})
}

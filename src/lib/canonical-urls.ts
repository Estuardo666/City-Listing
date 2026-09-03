/**
 * Single source of truth for the public URLs that identify a piece of content.
 *
 * The web pages, the share sheets, the mobile API payloads, the push deep links
 * and the Universal Links association file all have to agree on these paths: a
 * link that the app claims but the site does not serve (or vice versa) silently
 * falls back to Safari. Add a new shareable resource here first, then everywhere
 * else.
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://viveloja.com').replace(/\/$/, '')

export type ShareableKind = 'venue' | 'event' | 'post' | 'watchEvent' | 'route' | 'collection'

/** Path segment used by the public web route of each kind. */
const SEGMENTS: Record<ShareableKind, string> = {
  venue: 'locales',
  event: 'eventos',
  post: 'blog',
  watchEvent: 'partidos',
  route: 'rutas',
  collection: 'colecciones',
}

export const SHAREABLE_KINDS = Object.keys(SEGMENTS) as ShareableKind[]

/** Wildcard patterns for apple-app-site-association / assetlinks. */
export const DEEP_LINK_PATH_PATTERNS = SHAREABLE_KINDS.map((kind) => `/${SEGMENTS[kind]}/*`)

/** Root-relative canonical path, e.g. `/rutas/centro-historico`. */
export function canonicalPath(kind: ShareableKind, slug: string): string {
  return `/${SEGMENTS[kind]}/${slug}`
}

/** Absolute canonical URL, e.g. `https://viveloja.com/rutas/centro-historico`. */
export function canonicalUrl(kind: ShareableKind, slug: string): string {
  return `${SITE_URL}${canonicalPath(kind, slug)}`
}

/** Reverse lookup used when resolving an incoming deep link. */
export function kindFromSegment(segment: string): ShareableKind | null {
  const normalized = segment.toLowerCase()
  const match = SHAREABLE_KINDS.find((kind) => SEGMENTS[kind] === normalized)
  return match ?? null
}

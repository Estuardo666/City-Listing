import { displayableImageUrl } from './image-url'

const STOCK_IMAGE_HOSTS = new Set(['images.unsplash.com', 'unsplash.com'])

/** Event artwork must come from the source, never from a generic stock fallback. */
export function displayableEventImageUrl(value: string | null | undefined): string | null {
  const imageUrl = displayableImageUrl(value)
  if (!imageUrl) return null

  try {
    const url = new URL(imageUrl)
    if (STOCK_IMAGE_HOSTS.has(url.hostname.toLowerCase())) return null
  } catch {
    // displayableImageUrl already validated local paths and rejected invalid URLs.
  }

  return imageUrl
}

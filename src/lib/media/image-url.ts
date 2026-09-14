const NON_IMAGE_EXTENSION = /\.(?:mp4|mov|m4v|webm|avi|mkv)(?:[?#]|$)/i

/** Keep media that browsers and Next Image can actually render as an image. */
export function displayableImageUrl(value: string | null | undefined): string | null {
  if (!value) return null
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return value.startsWith('/') && !NON_IMAGE_EXTENSION.test(value) ? value : null
  }

  if (!['http:', 'https:'].includes(url.protocol)) return null
  if (url.hostname.toLowerCase() === 'logo.clearbit.com') return null
  if (NON_IMAGE_EXTENSION.test(url.pathname)) return null
  return value
}

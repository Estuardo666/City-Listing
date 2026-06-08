const URL_PATTERNS = [
  /https?:\/\/[^\s]+/gi,
  /www\.[^\s]+/gi,
  /\b[a-zA-Z0-9-]+\.(com|net|org|io|edu|gov|info|biz|xyz|online|site|tech|store|app|dev)\b/gi,
  /\b(t\.me|bit\.ly|tinyurl\.com|goo\.gl|is\.gd|cutt\.ly|rb\.gy|shorte\.st)\b/gi,
]

export interface ContentValidationResult {
  hasLinks: boolean
  hasProfanity: boolean
  matchedProfanityWords: string[]
  shouldFlag: boolean
  flagReasons: string[]
}

export function containsLinks(text: string | null | undefined): boolean {
  if (!text) return false

  for (const pattern of URL_PATTERNS) {
    pattern.lastIndex = 0
    if (pattern.test(text)) return true
  }

  return false
}

const PROFANITY_LIST = [
  'puto', 'puta', 'putas', 'putos',
  'pendejo', 'pendeja', 'pendejos', 'pendejas',
  'cabron', 'cabrón', 'cabrona', 'cabrones', 'cabronas',
  'chinga', 'chingar', 'chingada', 'chingado', 'chingas',
  'mierda', 'mierdas',
  'verga', 'vergas',
  'culero', 'culera', 'culeros', 'culeras',
  'pendejo', 'pendejos',
  'estupido', 'estúpido', 'estupida', 'estúpida',
  'idiota', 'idiotas',
  'imbecil', 'imbécil', 'imbeciles', 'imbéciles',
  'bobo', 'boba', 'bobos', 'bobas',
  'tarado', 'tarada', 'tarados', 'taradas',
  'baboso', 'babosa', 'babosos', 'babosas',
  'mongol', 'mongola', 'mongoles',
  'reteputo', 'reteputa',
  'hijueputa', 'hijosdeputa',
  'malparido', 'malparida', 'malparidos', 'malparidas',
  'marica', 'maricas', 'maricon', 'maricón', 'maricones',
  'perra', 'perras', 'perro', 'perros',
  'zorra', 'zorras',
  'coño', 'coños',
  'cagar', 'cagada', 'cagado',
  'joder', 'jodido', 'jodida',
  'maldito', 'maldita', 'malditos', 'malditas',
  'cono', 'concha', 'conchatumadre',
  'gil', 'gilipollas',
  'huevon', 'huevón', 'huevona', 'huevones',
  'boludo', 'boluda', 'boludos', 'bldas',
  'pelotudo', 'pelotuda', 'pelotudos', 'pelotudas',
  'forro', 'forra', 'forros', 'forras',
  'cagon', 'cagón', 'cagona',
  'orto',
  'pija', 'pijas',
  'chota',
  'chupapija',
  'chupala',
  'lamelo',
  'csm',
  'ptm',
  'hdp',
  'ctm',
  'lpqtp',
  'nmms',
  'nmmn',
]

const SUBSTITUTIONS: Record<string, string> = {
  '@': 'a',
  '4': 'a',
  '3': 'e',
  '1': 'i',
  '!': 'i',
  '0': 'o',
  '5': 's',
  '$': 's',
  '7': 't',
  '+': 't',
}

function normalizeText(text: string): string {
  let normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  for (const [symbol, letter] of Object.entries(SUBSTITUTIONS)) {
    normalized = normalized.split(symbol).join(letter)
  }

  normalized = normalized.replace(/[^a-z\s]/g, '')
  normalized = normalized.replace(/\s+/g, ' ').trim()

  return normalized
}

export interface ProfanityResult {
  hasProfanity: boolean
  matchedWords: string[]
}

export function containsProfanity(text: string | null | undefined): ProfanityResult {
  if (!text) return { hasProfanity: false, matchedWords: [] }

  const normalized = normalizeText(text)
  const matchedWords: string[] = []

  for (const word of PROFANITY_LIST) {
    const normalizedWord = normalizeText(word)
    const regex = new RegExp(`\\b${normalizedWord}\\b`, 'i')
    if (regex.test(normalized)) {
      matchedWords.push(word)
    }
  }

  return {
    hasProfanity: matchedWords.length > 0,
    matchedWords: [...new Set(matchedWords)],
  }
}

export const POINTS = {
  REVIEW_TEXT: 10,
  REVIEW_PHOTO: 20,
  CHECKIN: 5,
  CHECKIN_PHOTO: 10,
  HELPFUL_VOTE: 2,
  OWNER_REPLY: 5,
} as const

export const LEVELS = [
  { level: 1, name: 'Nuevo Explorador', minPoints: 0, color: 'gray', icon: '🌱' },
  { level: 2, name: 'Explorador', minPoints: 50, color: 'blue', icon: '🧭' },
  { level: 3, name: 'Guía Local', minPoints: 200, color: 'green', icon: '🗺️' },
  { level: 4, name: 'Guía Senior', minPoints: 500, color: 'purple', icon: '⭐' },
  { level: 5, name: 'Guía Experto', minPoints: 1500, color: 'amber', icon: '🏆' },
  { level: 6, name: 'Guía Maestro', minPoints: 3000, color: 'rose', icon: '👑' },
  { level: 7, name: 'Leyenda Local', minPoints: 6000, color: 'yellow', icon: '💎' },
] as const

export const BADGES = {
  FIRST_REVIEW: {
    type: 'FIRST_REVIEW',
    name: 'Primera Reseña',
    description: 'Escribiste tu primera reseña',
    icon: '✍️',
    condition: (stats: UserStats) => stats.totalReviews >= 1,
  },
  REVIEW_PROLIFIC: {
    type: 'REVIEW_PROLIFIC',
    name: 'Reseñador Prolífico',
    description: 'Escribiste 10 reseñas',
    icon: '📝',
    condition: (stats: UserStats) => stats.totalReviews >= 10,
  },
  REVIEW_MASTER: {
    type: 'REVIEW_MASTER',
    name: 'Maestro Reseñador',
    description: 'Escribiste 50 reseñas',
    icon: '📚',
    condition: (stats: UserStats) => stats.totalReviews >= 50,
  },
  CHECKIN_EXPLORER: {
    type: 'CHECKIN_EXPLORER',
    name: 'Explorador Urbano',
    description: '10 check-ins en locales',
    icon: '📍',
    condition: (stats: UserStats) => stats.totalCheckIns >= 10,
  },
  CHECKIN_MASTER: {
    type: 'CHECKIN_MASTER',
    name: 'Leyenda del Check-in',
    description: '50 check-ins en locales',
    icon: '🏅',
    condition: (stats: UserStats) => stats.totalCheckIns >= 50,
  },
  PHOTO_CONTRIBUTOR: {
    type: 'PHOTO_CONTRIBUTOR',
    name: 'Fotógrafo Local',
    description: 'Subiste 10 fotos',
    icon: '📸',
    condition: (stats: UserStats) => stats.totalPhotos >= 10,
  },
  PHOTO_MASTER: {
    type: 'PHOTO_MASTER',
    name: 'Maestro Fotógrafo',
    description: 'Subiste 50 fotos',
    icon: '🎨',
    condition: (stats: UserStats) => stats.totalPhotos >= 50,
  },
  HELPFUL_REVIEWER: {
    type: 'HELPFUL_REVIEWER',
    name: 'Reseña Útil',
    description: 'Tus reseñas recibieron 20 votos útiles',
    icon: '👍',
    condition: (stats: UserStats) => stats.totalHelpfulVotes >= 20,
  },
  LEVEL_5: {
    type: 'LEVEL_5',
    name: 'Guía Experto',
    description: 'Alcanzaste el nivel 5',
    icon: '🌟',
    condition: (stats: UserStats) => stats.reputationScore >= 1500,
  },
  LEVEL_7: {
    type: 'LEVEL_7',
    name: 'Leyenda Local',
    description: 'Alcanzaste el nivel máximo',
    icon: '💎',
    condition: (stats: UserStats) => stats.reputationScore >= 6000,
  },
} as const

export type UserStats = {
  reputationScore: number
  totalReviews: number
  totalCheckIns: number
  totalPhotos: number
  totalHelpfulVotes: number
}

type Level = typeof LEVELS[number]

export function calculateLevel(points: number) {
  let current: Level = LEVELS[0]
  let next: Level | null = null

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) {
      current = LEVELS[i]
      next = i < LEVELS.length - 1 ? LEVELS[i + 1] : null
      break
    }
  }

  const pointsToNext = next ? next.minPoints - points : 0
  const progress = next
    ? ((points - current.minPoints) / (next.minPoints - current.minPoints)) * 100
    : 100

  return {
    level: current.level,
    name: current.name,
    color: current.color,
    icon: current.icon,
    currentPoints: points,
    minPoints: current.minPoints,
    nextLevel: next?.level ?? null,
    nextLevelName: next?.name ?? null,
    pointsToNext,
    progress: Math.min(100, Math.max(0, progress)),
  }
}

export function getLevelColor(level: number): string {
  const levelData = LEVELS.find((l) => l.level === level) ?? LEVELS[0]
  const colorMap: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
    rose: 'bg-rose-100 text-rose-700 border-rose-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  }
  return colorMap[levelData.color] ?? colorMap.gray
}

export function getLevelGradient(level: number): string {
  const levelData = LEVELS.find((l) => l.level === level) ?? LEVELS[0]
  const gradientMap: Record<string, string> = {
    gray: 'from-gray-400 to-gray-500',
    blue: 'from-blue-400 to-blue-600',
    green: 'from-green-400 to-green-600',
    purple: 'from-purple-400 to-purple-600',
    amber: 'from-amber-400 to-amber-600',
    rose: 'from-rose-400 to-rose-600',
    yellow: 'from-yellow-400 to-yellow-600',
  }
  return gradientMap[levelData.color] ?? gradientMap.gray
}

export function getProgressBarColor(color: string): string {
  const colorMap: Record<string, string> = {
    gray: 'bg-gray-400',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    yellow: 'bg-yellow-500',
  }
  return colorMap[color] ?? colorMap.gray
}

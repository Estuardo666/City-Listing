export const MIN_REVIEWS_FOR_RANKING = 4

export type VenueBadgeType = 'TOP_10' | 'BEST_RATED' | 'TRENDING' | 'COMMUNITY_FAVORITE'

export function getBadgeInfo(badge: VenueBadgeType) {
  const badges: Record<VenueBadgeType, { label: string; icon: string; color: string }> = {
    TOP_10: {
      label: 'Top 10 de su categoria',
      icon: '🏆',
      color: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    BEST_RATED: {
      label: 'Mejor calificado',
      icon: '⭐',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    TRENDING: {
      label: 'Tendencia del mes',
      icon: '🔥',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
    },
    COMMUNITY_FAVORITE: {
      label: 'Favorito de la comunidad',
      icon: '👑',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
    },
  }
  return badges[badge]
}

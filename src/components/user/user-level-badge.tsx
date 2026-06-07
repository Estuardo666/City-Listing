'use client'

import { calculateLevel, getLevelColor } from '@/lib/gamification'
import { cn } from '@/lib/utils'

type UserLevelBadgeProps = {
  reputationScore: number
  reviewerLevel: number
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  className?: string
}

export function UserLevelBadge({
  reputationScore,
  reviewerLevel,
  size = 'sm',
  showName = true,
  className,
}: UserLevelBadgeProps) {
  const levelInfo = calculateLevel(reputationScore)
  const colorClasses = getLevelColor(reviewerLevel)

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }

  const iconSizes = {
    sm: 'text-[10px]',
    md: 'text-sm',
    lg: 'text-base',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-semibold',
        colorClasses,
        sizeClasses[size],
        className
      )}
      title={`Nivel ${reviewerLevel}: ${levelInfo.name} (${reputationScore} puntos)`}
    >
      <span className={iconSizes[size]}>{levelInfo.icon}</span>
      {showName && <span>{levelInfo.name}</span>}
    </span>
  )
}

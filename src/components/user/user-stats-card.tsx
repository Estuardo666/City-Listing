'use client'

import { calculateLevel, getLevelColor, getProgressBarColor, LEVELS } from '@/lib/gamification'
import { cn } from '@/lib/utils'
import { Star, MapPin, Camera, ThumbsUp, Award } from 'lucide-react'

type UserStatsCardProps = {
  user: {
    name: string | null
    image: string | null
    reputationScore: number
    reviewerLevel: number
    totalReviews: number
    totalCheckIns: number
    totalPhotos: number
    totalHelpfulVotes: number
  }
  badges?: Array<{
    badgeType: string
    name: string
    description: string
    icon: string | null
  }>
  className?: string
}

export function UserStatsCard({ user, badges = [], className }: UserStatsCardProps) {
  const levelInfo = calculateLevel(user.reputationScore)
  const colorClasses = getLevelColor(user.reviewerLevel)

  return (
    <div className={cn('rounded-2xl border border-border/50 bg-card p-6', className)}>
      {/* Nivel actual */}
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-2xl text-3xl',
            colorClasses
          )}
        >
          {levelInfo.icon}
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Nivel {user.reviewerLevel}</p>
          <p className="text-lg font-medium text-foreground">{levelInfo.name}</p>
          <p className="text-xs text-muted-foreground">
            {user.reputationScore} puntos
            {levelInfo.nextLevel && ` · ${levelInfo.pointsToNext} para ${levelInfo.nextLevelName}`}
          </p>
        </div>
      </div>

      {/* Barra de progreso */}
      {levelInfo.nextLevel && (
        <div className="mt-4">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', getProgressBarColor(levelInfo.color))}
              style={{ width: `${levelInfo.progress}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>Nivel {user.reviewerLevel}</span>
            <span>Nivel {levelInfo.nextLevel}</span>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex items-center gap-2 rounded-xl bg-secondary/50 px-3 py-2">
          <Star className="h-4 w-4 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-foreground">{user.totalReviews}</p>
            <p className="text-[10px] text-muted-foreground">Reseñas</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-secondary/50 px-3 py-2">
          <MapPin className="h-4 w-4 text-rose-500" />
          <div>
            <p className="text-sm font-medium text-foreground">{user.totalCheckIns}</p>
            <p className="text-[10px] text-muted-foreground">Check-ins</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-secondary/50 px-3 py-2">
          <Camera className="h-4 w-4 text-blue-500" />
          <div>
            <p className="text-sm font-medium text-foreground">{user.totalPhotos}</p>
            <p className="text-[10px] text-muted-foreground">Fotos</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-secondary/50 px-3 py-2">
          <ThumbsUp className="h-4 w-4 text-green-500" />
          <div>
            <p className="text-sm font-medium text-foreground">{user.totalHelpfulVotes}</p>
            <p className="text-[10px] text-muted-foreground">Votos útiles</p>
          </div>
        </div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-foreground mb-3">
            <Award className="inline h-4 w-4 mr-1" />
            Insignias ({badges.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
              <div
                key={badge.badgeType}
                className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5"
                title={badge.description}
              >
                <span className="text-base">{badge.icon ?? '🏅'}</span>
                <span className="text-xs font-medium text-foreground">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Niveles disponibles */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-foreground mb-3">Niveles</h3>
        <div className="space-y-2">
          {LEVELS.map((level) => (
            <div
              key={level.level}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm',
                user.reviewerLevel >= level.level
                  ? 'bg-primary/5 text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              <span className="text-base">{level.icon}</span>
              <div className="flex-1">
                <p className="font-medium">
                  Nivel {level.level}: {level.name}
                </p>
                <p className="text-[10px]">{level.minPoints}+ puntos</p>
              </div>
              {user.reviewerLevel >= level.level && (
                <span className="text-xs font-semibold text-primary">✓</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

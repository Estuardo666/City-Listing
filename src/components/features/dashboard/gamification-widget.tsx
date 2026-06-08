'use client'

import Link from 'next/link'
import { calculateLevel, getLevelColor, getProgressBarColor } from '@/lib/gamification'
import { cn } from '@/lib/utils'
import { Award, Star, MapPin, Camera, ArrowRight } from 'lucide-react'

type GamificationWidgetProps = {
  user: {
    id: string
    name: string | null
    reputationScore: number
    reviewerLevel: number
    totalReviews: number
    totalCheckIns: number
    totalPhotos: number
  }
  className?: string
}

export function GamificationWidget({ user, className }: GamificationWidgetProps) {
  const levelInfo = calculateLevel(user.reputationScore)
  const colorClasses = getLevelColor(user.reviewerLevel)

  return (
    <div className={cn('rounded-2xl border border-border/50 bg-card p-6', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-foreground">
          <Award className="inline h-5 w-5 mr-2 text-primary" />
          Tu Progreso
        </h2>
        <Link
          href={`/perfil/${user.id}`}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
        >
          Ver perfil
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-2xl text-2xl',
            colorClasses
          )}
        >
          {levelInfo.icon}
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Nivel {user.reviewerLevel}</p>
          <p className="text-base font-medium text-foreground">{levelInfo.name}</p>
          <p className="text-xs text-muted-foreground">{user.reputationScore} puntos</p>
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
          <p className="mt-1 text-[10px] text-muted-foreground text-right">
            {levelInfo.pointsToNext} puntos para {levelInfo.nextLevelName}
          </p>
        </div>
      )}

      {/* Stats rápidos */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center rounded-xl bg-secondary/50 px-3 py-2">
          <Star className="h-4 w-4 text-amber-500 mb-1" />
          <p className="text-sm font-medium text-foreground">{user.totalReviews}</p>
          <p className="text-[10px] text-muted-foreground">Reseñas</p>
        </div>
        <div className="flex flex-col items-center rounded-xl bg-secondary/50 px-3 py-2">
          <MapPin className="h-4 w-4 text-rose-500 mb-1" />
          <p className="text-sm font-medium text-foreground">{user.totalCheckIns}</p>
          <p className="text-[10px] text-muted-foreground">Check-ins</p>
        </div>
        <div className="flex flex-col items-center rounded-xl bg-secondary/50 px-3 py-2">
          <Camera className="h-4 w-4 text-blue-500 mb-1" />
          <p className="text-sm font-medium text-foreground">{user.totalPhotos}</p>
          <p className="text-[10px] text-muted-foreground">Fotos</p>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-4 rounded-xl bg-primary/5 border border-primary/10 p-3">
        <p className="text-xs text-primary font-medium">
          💡 Escribe reseñas y haz check-ins para ganar puntos y subir de nivel
        </p>
      </div>
    </div>
  )
}

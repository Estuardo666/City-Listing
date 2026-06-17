'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Check, Star, MapPin, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LIFESTYLE_OPTIONS } from '@/lib/constants/onboarding'
import { saveInterestsAction } from '@/actions/onboarding/save-interests'
import { saveLifestylePreferencesAction } from '@/actions/onboarding/save-lifestyle-preferences'
import { followVenueAction, unfollowVenueAction } from '@/actions/onboarding/follow-venue'
import type { getOnboardingVenueCategories, getRecommendedVenuesForOnboarding } from '@/lib/queries/onboarding'

type Category = Awaited<ReturnType<typeof getOnboardingVenueCategories>>[number]
type Venue = Awaited<ReturnType<typeof getRecommendedVenuesForOnboarding>>[number]

interface InteresesClientProps {
  categories: Category[]
  venues: Venue[]
  initialInterests: string[]
  initialPreferences: string[]
  initialFollowing: string[]
}

type Tab = 'interests' | 'lifestyle' | 'venues'

export function InteresesClient({
  categories,
  venues,
  initialInterests,
  initialPreferences,
  initialFollowing,
}: InteresesClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('interests')
  const [interests, setInterests] = useState<string[]>(initialInterests)
  const [preferences, setPreferences] = useState<string[]>(initialPreferences)
  const [following, setFollowing] = useState<string[]>(initialFollowing)
  const [isPending, startTransition] = useTransition()

  const handleSaveInterests = () => {
    startTransition(async () => {
      const result = await saveInterestsAction(interests)
      if (result.success) toast.success('Intereses guardados')
      else toast.error('Error al guardar')
    })
  }

  const handleSavePreferences = () => {
    startTransition(async () => {
      const result = await saveLifestylePreferencesAction(preferences)
      if (result.success) toast.success('Preferencias guardadas')
      else toast.error('Error al guardar')
    })
  }

  const handleToggleFollow = (venueId: string) => {
    const isFollowing = following.includes(venueId)
    setFollowing((prev) =>
      isFollowing ? prev.filter((id) => id !== venueId) : [...prev, venueId]
    )
    startTransition(async () => {
      if (isFollowing) {
        await unfollowVenueAction(venueId)
        toast.success('Dejaste de seguir el local')
      } else {
        await followVenueAction(venueId)
        toast.success('Ahora sigues este local')
      }
    })
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'interests', label: 'Intereses', count: interests.length },
    { id: 'lifestyle', label: 'Preferencias', count: preferences.length },
    { id: 'venues', label: 'Locales', count: following.length },
  ]

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'relative flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="intereses-tab"
                className="absolute inset-0 rounded-lg bg-background shadow-sm"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">
              {tab.label} ({tab.count})
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'interests' && (
          <motion.div
            key="interests"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {categories.map((cat) => {
                const isSelected = interests.includes(cat.id)
                return (
                  <button
                    key={cat.id}
                    onClick={() =>
                      setInterests((prev) =>
                        isSelected ? prev.filter((id) => id !== cat.id) : [...prev, cat.id]
                      )
                    }
                    className={cn(
                      'relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all',
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-[0_0_16px_hsl(var(--primary)/0.15)]'
                        : 'border-border/50 hover:border-primary/30'
                    )}
                  >
                    {isSelected && (
                      <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </div>
                    )}
                    <span className="text-2xl">{cat.icon ?? '📍'}</span>
                    <span className={cn(
                      'text-xs font-semibold',
                      isSelected ? 'text-primary' : 'text-foreground'
                    )}>
                      {cat.name}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveInterests} disabled={isPending} className="gap-2">
                <Save className="h-4 w-4" />
                {isPending ? 'Guardando...' : 'Guardar intereses'}
              </Button>
            </div>
          </motion.div>
        )}

        {activeTab === 'lifestyle' && (
          <motion.div
            key="lifestyle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {LIFESTYLE_OPTIONS.map((opt) => {
                const isSelected = preferences.includes(opt.id)
                return (
                  <button
                    key={opt.id}
                    onClick={() =>
                      setPreferences((prev) =>
                        isSelected ? prev.filter((p) => p !== opt.id) : [...prev, opt.id]
                      )
                    }
                    className={cn(
                      'relative flex flex-col items-center gap-2.5 rounded-2xl border p-4 text-center transition-all sm:p-5',
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-[0_0_16px_hsl(var(--primary)/0.15)]'
                        : 'border-border/50 hover:border-primary/30'
                    )}
                  >
                    <div className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-xl',
                      opt.color
                    )}>
                      {opt.emoji}
                    </div>
                    <span className={cn(
                      'text-xs font-semibold sm:text-sm',
                      isSelected ? 'text-primary' : 'text-foreground'
                    )}>
                      {opt.label}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSavePreferences} disabled={isPending} className="gap-2">
                <Save className="h-4 w-4" />
                {isPending ? 'Guardando...' : 'Guardar preferencias'}
              </Button>
            </div>
          </motion.div>
        )}

        {activeTab === 'venues' && (
          <motion.div
            key="venues"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {venues.map((venue) => {
                const isFollowed = following.includes(venue.id)
                const firstCategory = venue.venueCategories[0]?.category
                return (
                  <div
                    key={venue.id}
                    className="group flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-3 transition-shadow hover:shadow-md"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                      {venue.image ? (
                        <img src={venue.image} alt={venue.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                          <span className="text-2xl">{firstCategory?.icon ?? '📍'}</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{venue.name}</p>
                      {firstCategory && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {firstCategory.icon} {firstCategory.name}
                        </p>
                      )}
                      {venue.avgRating != null && (
                        <div className="mt-1 flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-xs text-muted-foreground">{venue.avgRating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleToggleFollow(venue.id)}
                      disabled={isPending}
                      className={cn(
                        'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                        isFollowed
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                      )}
                    >
                      {isFollowed ? (
                        <><Check className="h-3.5 w-3.5" /> Siguiendo</>
                      ) : (
                        <><Heart className="h-3.5 w-3.5" /> Seguir</>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

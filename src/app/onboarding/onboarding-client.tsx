'use client'

import { useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { OnboardingShell } from '@/components/onboarding/onboarding-shell'
import { ProgressDots } from '@/components/onboarding/progress-dots'
import { StepHeader } from '@/components/onboarding/step-header'
import { SkipButton } from '@/components/onboarding/skip-button'
import { InterestsStep } from './steps/interests-step'
import { LifestyleStep } from './steps/lifestyle-step'
import { VenuesStep } from './steps/venues-step'
import { WelcomeStep } from './steps/welcome-step'
import { ONBOARDING_COPY, MIN_INTERESTS, runWithSingleRetry } from '@/lib/constants/onboarding'
import { saveInterestsAction } from '@/actions/onboarding/save-interests'
import { saveLifestylePreferencesAction } from '@/actions/onboarding/save-lifestyle-preferences'
import { followVenueAction } from '@/actions/onboarding/follow-venue'
import { completeOnboardingAction } from '@/actions/onboarding/complete-onboarding'
import { skipOnboardingAction } from '@/actions/onboarding/skip-onboarding'
import { trackOnboardingEventAction } from '@/actions/onboarding/track-event'
import type { getOnboardingVenueCategories, getRecommendedVenuesForOnboarding } from '@/lib/queries/onboarding'

type Category = Awaited<ReturnType<typeof getOnboardingVenueCategories>>[number]
type Venue = Awaited<ReturnType<typeof getRecommendedVenuesForOnboarding>>[number]

interface OnboardingClientProps {
  categories: Category[]
  venues: Venue[]
  userName: string | null
  returnTo?: string | null
}

const TOTAL_STEPS = 4

const stepTransition = { duration: 0.2, ease: [0.23, 1, 0.32, 1] as const }

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 16 : -16,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 16 : -16,
    opacity: 0,
  }),
}

export function OnboardingClient({ categories, venues, userName, returnTo }: OnboardingClientProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(0)
  const [isPending, startTransition] = useTransition()

  // State for each step
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [selectedLifestyle, setSelectedLifestyle] = useState<string[]>([])
  const [followedVenues, setFollowedVenues] = useState<string[]>([])

  // Track step start
  const trackStep = useCallback((step: number) => {
    trackOnboardingEventAction('STEP_VIEWED', step).catch(() => {})
  }, [])

  const handleToggleInterest = useCallback((categoryId: string) => {
    setSelectedInterests((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    )
  }, [])

  const handleToggleLifestyle = useCallback((preference: string) => {
    setSelectedLifestyle((prev) =>
      prev.includes(preference) ? prev.filter((p) => p !== preference) : [...prev, preference]
    )
  }, [])

  const handleFollowVenue = useCallback((venueId: string) => {
    setFollowedVenues((prev) =>
      prev.includes(venueId) ? prev.filter((id) => id !== venueId) : [...prev, venueId]
    )
  }, [])

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 0: return selectedInterests.length >= MIN_INTERESTS
      case 1: return selectedLifestyle.length > 0
      case 2: return true // venues are optional
      case 3: return true
      default: return false
    }
  }, [currentStep, selectedInterests.length, selectedLifestyle.length])

  const handleNext = useCallback(() => {
    if (!canProceed() || isPending) return

    // Save data for current step
    startTransition(async () => {
      try {
        if (currentStep === 0) {
          const result = await saveInterestsAction(selectedInterests)
          if (!result.success) throw new Error('No se pudieron guardar los intereses')
          trackOnboardingEventAction('STEP_COMPLETED', 0, { interests: selectedInterests })
        } else if (currentStep === 1) {
          const result = await saveLifestylePreferencesAction(selectedLifestyle)
          if (!result.success) throw new Error('No se pudieron guardar las preferencias')
          trackOnboardingEventAction('STEP_COMPLETED', 1, { preferences: selectedLifestyle })
        } else if (currentStep === 2) {
          if (followedVenues.length > 0) {
            for (const venueId of followedVenues) {
              await followVenueAction(venueId)
            }
          }
          trackOnboardingEventAction('STEP_COMPLETED', 2, { venuesFollowed: followedVenues.length })
        }

        if (currentStep < TOTAL_STEPS - 1) {
          setDirection(1)
          setCurrentStep((s) => s + 1)
          trackStep(currentStep + 1)
        }
      } catch {
        toast.error('Hubo un error. Intenta de nuevo.')
      }
    })
  }, [currentStep, canProceed, isPending, selectedInterests, selectedLifestyle, followedVenues, trackStep])

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1)
      setCurrentStep((s) => s - 1)
    }
  }, [currentStep])

  const handleComplete = useCallback(() => {
    startTransition(async () => {
      try {
        const result = await runWithSingleRetry(() => completeOnboardingAction())
        if (result.success) {
          toast.success('Tus preferencias ya están aplicadas')
          router.push(returnTo ?? '/')
        } else {
          toast.error('No pudimos guardar tus preferencias. Revisa tu conexión e inténtalo otra vez.')
        }
      } catch {
        toast.error('No pudimos guardar tus preferencias. Revisa tu conexión e inténtalo otra vez.')
      }
    })
  }, [returnTo, router])

  const handleSkip = useCallback(() => {
    startTransition(async () => {
      try {
        await skipOnboardingAction()
        router.push(returnTo ?? '/')
      } catch {
        router.push(returnTo ?? '/')
      }
    })
  }, [returnTo, router])

  const selectedInterestCategories = categories.filter((c) => selectedInterests.includes(c.id))
  const followingVenueData = venues.filter((v) => followedVenues.includes(v.id)).map((v) => ({
    id: v.id,
    name: v.name,
    slug: v.slug,
    image: v.image,
    avgRating: v.avgRating,
    reviewCount: v.reviewCount,
    venueCategories: v.venueCategories,
  }))

  const stepCopy = [
    ONBOARDING_COPY.step1,
    ONBOARDING_COPY.step2,
    ONBOARDING_COPY.step3,
    ONBOARDING_COPY.step4,
  ][currentStep]

  return (
    <OnboardingShell
      header={
        <>
          <div className="w-24">
            {currentStep > 0 && currentStep < TOTAL_STEPS - 1 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  disabled={isPending}
                  className="min-h-11 gap-1 text-muted-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Atrás
                </Button>
              </motion.div>
            )}
          </div>

          <ProgressDots currentStep={currentStep} totalSteps={TOTAL_STEPS} />

          <div className="flex w-24 justify-end">
            {currentStep < TOTAL_STEPS - 1 && (
              <SkipButton onSkip={handleSkip} />
            )}
          </div>
        </>
      }
    >
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Step header */}
        <div className="shrink-0 px-4 pb-4 pt-6 sm:px-6 sm:pt-8">
          <StepHeader
            title={stepCopy.title}
            subtitle={stepCopy.subtitle}
            stepKey={`step-${currentStep}`}
          />
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-4 pb-32 sm:px-6">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={stepTransition}
              className="mx-auto max-w-2xl"
            >
              {currentStep === 0 && (
                <InterestsStep
                  categories={categories}
                  selected={selectedInterests}
                  onToggle={handleToggleInterest}
                />
              )}
              {currentStep === 1 && (
                <LifestyleStep
                  selected={selectedLifestyle}
                  onToggle={handleToggleLifestyle}
                />
              )}
              {currentStep === 2 && (
                <VenuesStep
                  venues={venues}
                  followed={followedVenues}
                  onFollow={handleFollowVenue}
                />
              )}
              {currentStep === 3 && (
                <WelcomeStep
                  interests={selectedInterestCategories}
                  preferences={selectedLifestyle}
                  followingVenues={followingVenueData}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border/60 bg-background/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl sm:px-6">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground">
              {currentStep === 0 && (
                <span>
                  {selectedInterests.length < MIN_INTERESTS
                    ? `Selecciona al menos ${MIN_INTERESTS} (${selectedInterests.length}/${MIN_INTERESTS})`
                    : `${selectedInterests.length} seleccionados`}
                </span>
              )}
              {currentStep === 1 && selectedLifestyle.length > 0 && (
                <span>{selectedLifestyle.length} seleccionados</span>
              )}
              {currentStep === 2 && followedVenues.length > 0 && (
                <span>Sigues {followedVenues.length} lugares</span>
              )}
            </div>

            {currentStep < TOTAL_STEPS - 1 ? (
              <motion.div
                animate={{
                  opacity: canProceed() ? 1 : 0.5,
                  scale: canProceed() ? 1 : 0.98,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Button
                  onClick={handleNext}
                  disabled={!canProceed() || isPending}
                  size="lg"
                  className="gap-2 rounded-xl px-8"
                >
                  {isPending ? 'Guardando...' : 'Continuar'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.5 }}
              >
                <Button
                  onClick={handleComplete}
                  disabled={isPending}
                  size="lg"
                  className="gap-2 rounded-xl px-8 shadow-[0_0_30px_hsl(var(--primary)/0.3)]"
                >
                  {isPending ? 'Preparando...' : 'Comenzar a explorar'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </OnboardingShell>
  )
}

'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

interface WizardNavigationProps {
  isFirstStep: boolean
  isLastStep: boolean
  canProceed: boolean
  isSubmitting: boolean
  submitLabel: string
  onPrevious: () => void
  onNext: () => void
}

export function WizardNavigation({
  isFirstStep,
  isLastStep,
  canProceed,
  isSubmitting,
  submitLabel,
  onPrevious,
  onNext,
}: WizardNavigationProps) {
  return (
    <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-6">
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={isFirstStep || isSubmitting}
        className="gap-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Anterior
      </Button>

      <Button
        type="button"
        onClick={onNext}
        disabled={!canProceed || isSubmitting}
        className="gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Guardando...
          </>
        ) : isLastStep ? (
          submitLabel
        ) : (
          <>
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  )
}

'use client'

import { useState, useCallback, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { WizardProgress } from './wizard-progress'
import { WizardNavigation } from './wizard-navigation'

export interface WizardStep {
  id: string
  title: string
  description?: string
  icon?: ReactNode
  content: ReactNode
  isValid?: boolean
}

interface WizardProps {
  steps: WizardStep[]
  onComplete: () => void | Promise<void>
  isSubmitting?: boolean
  submitLabel?: string
  className?: string
}

export function Wizard({ steps, onComplete, isSubmitting = false, submitLabel = 'Finalizar', className }: WizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1
  const currentStepData = steps[currentStep]
  const canProceed = currentStepData?.isValid !== false

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex)
    }
  }, [steps.length])

  const handleNext = useCallback(() => {
    if (!canProceed) return

    setCompletedSteps((prev) => new Set(prev).add(currentStep))

    if (isLastStep) {
      onComplete()
    } else {
      goToStep(currentStep + 1)
    }
  }, [canProceed, currentStep, isLastStep, onComplete, goToStep])

  const handlePrevious = useCallback(() => {
    if (!isFirstStep) {
      goToStep(currentStep - 1)
    }
  }, [currentStep, isFirstStep, goToStep])

  const handleStepClick = useCallback((stepIndex: number) => {
    if (stepIndex <= currentStep || completedSteps.has(stepIndex)) {
      goToStep(stepIndex)
    }
  }, [currentStep, completedSteps, goToStep])

  return (
    <div className={cn('mx-auto w-full max-w-full lg:max-w-[60%]', className)}>
      <WizardProgress
        steps={steps}
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
      />

      <div className="mt-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">{currentStepData.title}</h2>
          {currentStepData.description && (
            <p className="mt-1 text-sm text-muted-foreground">{currentStepData.description}</p>
          )}
        </div>

        <div className="min-h-[400px]">
          {currentStepData.content}
        </div>
      </div>

      <WizardNavigation
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        canProceed={canProceed}
        isSubmitting={isSubmitting}
        submitLabel={submitLabel}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />
    </div>
  )
}

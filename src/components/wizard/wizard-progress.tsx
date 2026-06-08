'use client'

import { Check } from 'lucide-react'
import type { WizardStep } from './wizard'

interface WizardProgressProps {
  steps: WizardStep[]
  currentStep: number
  completedSteps: Set<number>
  onStepClick: (stepIndex: number) => void
}

export function WizardProgress({ steps, currentStep, completedSteps, onStepClick }: WizardProgressProps) {
  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(index)
          const isCurrent = index === currentStep
          const isClickable = index <= currentStep || isCompleted

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => isClickable && onStepClick(index)}
              disabled={!isClickable}
              className={`relative flex flex-col items-center gap-2 ${
                isClickable ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                  isCompleted
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : isCurrent
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : step.icon ? (
                  step.icon
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <span
                className={`text-xs font-medium text-center max-w-[80px] leading-tight ${
                  isCurrent ? 'text-foreground' : isCompleted ? 'text-emerald-600' : 'text-muted-foreground'
                }`}
              >
                {step.title}
              </span>
            </button>
          )
        })}
      </div>

      <div className="absolute left-0 top-5 -z-10 flex w-full items-center px-5">
        {steps.map((_, index) => {
          if (index === steps.length - 1) return null
          const isCompleted = completedSteps.has(index)
          return (
            <div
              key={index}
              className={`h-0.5 flex-1 ${
                isCompleted ? 'bg-emerald-500' : 'bg-border'
              }`}
            />
          )
        })}
      </div>
    </div>
  )
}

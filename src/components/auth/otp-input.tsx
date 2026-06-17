'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface OtpInputProps {
  length?: number
  onComplete: (code: string) => void
  disabled?: boolean
  error?: string
}

export function OtpInput({ length = 6, onComplete, disabled = false, error }: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''))
  const [focusedIndex, setFocusedIndex] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!disabled) {
      inputRefs.current[0]?.focus()
    }
  }, [disabled])

  const handleChange = useCallback(
    (index: number, value: string) => {
      if (disabled) return
      if (value && !/^\d$/.test(value)) return

      const newValues = [...values]
      newValues[index] = value
      setValues(newValues)

      // Auto-advance
      if (value && index < length - 1) {
        inputRefs.current[index + 1]?.focus()
      }

      // Auto-submit when all filled
      if (value && index === length - 1) {
        const code = newValues.join('')
        if (code.length === length) {
          onComplete(code)
        }
      }
    },
    [values, length, onComplete, disabled]
  )

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (disabled) return

      if (e.key === 'Backspace') {
        if (!values[index] && index > 0) {
          const newValues = [...values]
          newValues[index - 1] = ''
          setValues(newValues)
          inputRefs.current[index - 1]?.focus()
        } else {
          const newValues = [...values]
          newValues[index] = ''
          setValues(newValues)
        }
      }

      if (e.key === 'ArrowLeft' && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }

      if (e.key === 'ArrowRight' && index < length - 1) {
        inputRefs.current[index + 1]?.focus()
      }
    },
    [values, length, disabled]
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (disabled) return
      e.preventDefault()

      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
      if (!pasted) return

      const newValues = [...values]
      for (let i = 0; i < pasted.length; i++) {
        newValues[i] = pasted[i]
      }
      setValues(newValues)

      const nextEmpty = newValues.findIndex((v) => !v)
      const focusIndex = nextEmpty === -1 ? length - 1 : nextEmpty
      inputRefs.current[focusIndex]?.focus()

      // Auto-submit if all filled
      if (newValues.every((v) => v)) {
        onComplete(newValues.join(''))
      }
    },
    [values, length, onComplete, disabled]
  )

  return (
    <div className="space-y-3">
      <div className="flex justify-center gap-2 sm:gap-3">
        {Array.from({ length }, (_, i) => (
          <motion.div
            key={i}
            animate={
              error
                ? {
                    x: [0, -4, 4, -4, 4, 0],
                    transition: { duration: 0.4 },
                  }
                : {}
            }
          >
            <Input
              ref={(el) => {
                inputRefs.current[i] = el
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={values[i]}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              onFocus={() => setFocusedIndex(i)}
              onBlur={() => setFocusedIndex(-1)}
              disabled={disabled}
              className={cn(
                'h-14 w-11 text-center text-xl font-bold sm:h-16 sm:w-13',
                'transition-all duration-200',
                focusedIndex === i && !error && 'border-primary ring-2 ring-primary/20 scale-105',
                error && 'border-destructive',
                values[i] && !error && 'border-primary/50 bg-primary/5'
              )}
              aria-label={`Dígito ${i + 1}`}
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

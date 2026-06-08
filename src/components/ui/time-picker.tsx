'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00', '15', '30', '45']

export function TimePicker({ value, onChange, className, disabled }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  const [hour, minute] = value ? value.split(':') : ['09', '00']

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setCoords({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      })
    }

    function handleClickOutside(e: MouseEvent) {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    function handleScroll() {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        setCoords({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
        })
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [isOpen])

  const selectTime = useCallback((h: string, m: string) => {
    onChange(`${h}:${m}`)
    setIsOpen(false)
  }, [onChange])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          'flex h-8 w-24 items-center gap-1.5 rounded-md border border-input bg-background px-2 text-sm transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
      >
        <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-left tabular-nums">{value || '--:--'}</span>
      </button>

      {isOpen && mounted && coords && createPortal(
        <div
          ref={dropdownRef}
          style={{ top: coords.top, left: coords.left, position: 'absolute' }}
          className="z-[9999] flex gap-0 overflow-hidden rounded-lg border border-border bg-popover shadow-lg"
        >
          <div className="max-h-52 overflow-y-auto border-r border-border/50 px-1 py-1 scrollbar-thin">
            {HOURS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => selectTime(h, minute)}
                className={cn(
                  'flex h-7 w-10 items-center justify-center rounded text-xs tabular-nums transition-colors hover:bg-accent',
                  h === hour && 'bg-primary text-primary-foreground font-semibold'
                )}
              >
                {h}
              </button>
            ))}
          </div>
          <div className="max-h-52 overflow-y-auto px-1 py-1 scrollbar-thin">
            {MINUTES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => selectTime(hour, m)}
                className={cn(
                  'flex h-7 w-10 items-center justify-center rounded text-xs tabular-nums transition-colors hover:bg-accent',
                  m === minute && 'bg-primary text-primary-foreground font-semibold'
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

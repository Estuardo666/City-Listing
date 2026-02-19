'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type TagInputProps = {
  value: string[]
  onChange: (tags: string[]) => void
  max?: number
  placeholder?: string
  className?: string
}

export function TagInput({
  value,
  onChange,
  max = 8,
  placeholder = 'Añadir etiqueta…',
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 32)
    if (!tag || value.includes(tag) || value.length >= max) return
    onChange([...value, tag])
    setInputValue('')
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div
      className={cn(
        'flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
        >
          #{tag}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
            className="ml-0.5 rounded-full text-primary/60 hover:text-primary"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {value.length < max && (
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (inputValue.trim()) addTag(inputValue) }}
          placeholder={value.length === 0 ? placeholder : ''}
          className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      )}
      {value.length >= max && (
        <span className="text-xs text-muted-foreground">Máximo {max} etiquetas</span>
      )}
    </div>
  )
}

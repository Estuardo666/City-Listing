import { cn } from '@/lib/utils'

type UberIconProps = {
  className?: string
  size?: number
}

export function UberIcon({ className, size = 20 }: UberIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.207a9.793 9.793 0 1 1 0 19.586 9.793 9.793 0 0 1 0-19.586zM12 5.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zm0 2a4.5 4.5 0 0 1 4.5 4.5h-9A4.5 4.5 0 0 1 12 7.5zm-3.5 4.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1H9a.5.5 0 0 1-.5-.5z" />
    </svg>
  )
}

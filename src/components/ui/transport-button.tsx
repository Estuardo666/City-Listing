import { cn } from '@/lib/utils'
import type { TransportProvider } from '@/lib/transport'
import { UberIcon } from './uber-icon'

type TransportButtonProps = {
  provider: TransportProvider
  latitude: number
  longitude: number
  name: string
  className?: string
}

export function TransportButton({
  provider,
  latitude,
  longitude,
  name,
  className,
}: TransportButtonProps) {
  const isAvailable = provider.isAvailable({ latitude, longitude })

  if (!isAvailable) return null

  const href = provider.generateLink({ latitude, longitude, name })
  const isUber = provider.id === 'uber'

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Ir con ${provider.name} a ${name}`}
      role="link"
      className={cn(
        'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200',
        'border border-border bg-card text-foreground hover:bg-accent',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'active:scale-[0.99]',
        className
      )}
      style={
        isUber
          ? {
              backgroundColor: provider.brandColor,
              color: '#ffffff',
              borderColor: provider.brandColor,
            }
          : undefined
      }
    >
      {isUber ? (
        <UberIcon size={18} className="text-white" />
      ) : (
        <provider.icon className="h-4 w-4" />
      )}
      <span>{provider.name}</span>
    </a>
  )
}

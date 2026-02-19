import { cn } from '@/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-muted/80 before:absolute before:inset-0 before:-translate-x-full before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)] before:animate-[shimmer_1.4s_infinite]',
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }

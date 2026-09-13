'use client'

interface OnboardingShellProps {
  children: React.ReactNode
  header: React.ReactNode
}

export function OnboardingShell({ children, header }: OnboardingShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[linear-gradient(180deg,hsl(var(--secondary)/0.65),transparent)]" />

      {/* Header */}
      <header className="relative z-10 flex min-h-16 items-center justify-between border-b border-border/60 px-4 py-2 sm:px-6">
        {header}
      </header>

      {/* Content */}
      <main className="relative z-10 flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}

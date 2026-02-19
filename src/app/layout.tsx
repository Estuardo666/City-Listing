import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { AuthProvider } from '@/components/auth/auth-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { SonnerToaster } from '@/components/ui/sonner'
import { MapboxWorkerSetup } from '@/components/features/map/mapbox-worker-setup'
import { NotificationCenter } from '@/components/features/notifications/notification-center'
import { SiteHeader } from '@/components/layout'
import { CommandPalette } from '@/components/features/search/command-palette'
import { PageTransition } from '@/components/layout/page-transition'
import { ServiceWorkerRegister } from '@/components/providers/service-worker-register'

const googleSans = localFont({
  src: [
    { path: '../assets/fonts/google-sans/GoogleSans-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../assets/fonts/google-sans/GoogleSans-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../assets/fonts/google-sans/GoogleSans-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../assets/fonts/google-sans/GoogleSans-Italic.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CityListing Loja - Eventos, Locales y Noticias',
  description: 'Descubre todo lo que pasa en Loja, Ecuador. Eventos, restaurantes, bares, noticias y más.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  try {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored === 'dark' || stored === 'light' ? stored : (prefersDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  } catch {}
})();`,
          }}
        />
      </head>
      <body className={`${googleSans.variable} font-sans antialiased`}>
        <MapboxWorkerSetup />
        <ServiceWorkerRegister />
        <QueryProvider>
          <AuthProvider>
            <SiteHeader />
            <NotificationCenter />
            <CommandPalette />
            <PageTransition>{children}</PageTransition>
          </AuthProvider>
        </QueryProvider>
        <SonnerToaster />
      </body>
    </html>
  )
}

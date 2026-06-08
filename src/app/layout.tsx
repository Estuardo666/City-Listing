import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth/auth-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { SonnerToaster } from '@/components/ui/sonner'
import { MapboxWorkerSetup } from '@/components/features/map/mapbox-worker-setup'
import { SiteHeader, SiteFooter } from '@/components/layout'
import { PageTransition } from '@/components/layout/page-transition'
import { ScrollLockFix } from '@/components/ui/scroll-lock-fix'
import { LazyGlobals } from '@/components/providers/lazy-globals'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Vive Loja - Eventos, Locales y Noticias',
  description: 'Descubre todo lo que pasa en Loja, Ecuador. Eventos, restaurantes, bares, noticias y más.',
  verification: {
    google: 'qHtaXeEOJoJ1zVE1qL3381df3ufnZOBf4zVl4SgxZ2Y',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
        <link rel="icon" type="image/png" href="/viveloja.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  try {
    const stored = localStorage.getItem('theme');
    const theme = stored === 'dark' || stored === 'light' ? stored : 'light';
    document.documentElement.classList.toggle('dark', theme === 'dark');
  } catch {}
})();

// Forzar desactivación de zoom en iOS (Safari ignora user-scalable=no)
document.addEventListener('gesturestart', function(e) { e.preventDefault(); });
document.addEventListener('touchstart', function(e) { 
  if (e.touches.length > 1) { e.preventDefault(); } 
}, { passive: false });
let lastTouchEnd = 0;
document.addEventListener('touchend', function(e) {
  const now = (new Date()).getTime();
  if (now - lastTouchEnd <= 300) { e.preventDefault(); }
  lastTouchEnd = now;
}, { passive: false });`,
          }}
        />
      </head>
      <body className={`${geist.variable} font-sans antialiased`}>
        <ScrollLockFix />
        <MapboxWorkerSetup />
        <QueryProvider>
          <AuthProvider>
            <SiteHeader />
            <LazyGlobals />
            <PageTransition>{children}</PageTransition>
            <SiteFooter />
          </AuthProvider>
        </QueryProvider>
        <SonnerToaster />
      </body>
    </html>
  )
}

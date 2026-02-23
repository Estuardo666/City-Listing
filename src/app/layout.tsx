import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { AuthProvider } from '@/components/auth/auth-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { SonnerToaster } from '@/components/ui/sonner'
import { MapboxWorkerSetup } from '@/components/features/map/mapbox-worker-setup'
import { NotificationCenter } from '@/components/features/notifications/notification-center'
import { SiteHeader, SiteFooter } from '@/components/layout'
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
  title: 'Vive Loja - Eventos, Locales y Noticias',
  description: 'Descubre todo lo que pasa en Loja, Ecuador. Eventos, restaurantes, bares, noticias y más.',
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
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  try {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored === 'dark' || stored === 'light' ? stored : (prefersDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister());
      });
    }
    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key));
      });
    }
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
      <body className={`${googleSans.variable} font-sans antialiased`}>
        <MapboxWorkerSetup />
        <ServiceWorkerRegister />
        <QueryProvider>
          <AuthProvider>
            <SiteHeader />
            <NotificationCenter />
            <CommandPalette />
            <PageTransition>{children}</PageTransition>
            <SiteFooter />
          </AuthProvider>
        </QueryProvider>
        <SonnerToaster />
      </body>
    </html>
  )
}

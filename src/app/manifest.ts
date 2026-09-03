import type { MetadataRoute } from 'next'

/**
 * Web App Manifest. Together with `public/sw.js` this is what makes the site
 * installable — before it existed the app registered a service worker that was
 * never served, so Web Push could not work either.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vive Loja - Eventos, Locales y Noticias',
    short_name: 'Vive Loja',
    description:
      'Descubre todo lo que pasa en Loja, Ecuador. Eventos, restaurantes, bares, rutas y noticias.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#1437d2',
    lang: 'es-EC',
    categories: ['travel', 'lifestyle', 'food'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Explorar', url: '/explorar' },
      { name: 'Eventos', url: '/eventos' },
      { name: 'Rutas', url: '/rutas' },
    ],
  }
}

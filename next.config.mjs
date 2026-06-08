/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'mapbox-gl': 'mapbox-gl',
    }
    return config
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
    resolveAlias: {
      'mapbox-gl': 'mapbox-gl',
    },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'framer-motion', 'recharts'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:; style-src 'self' 'unsafe-inline' https://api.mapbox.com; img-src 'self' data: blob: https:; connect-src 'self' https://*.googleusercontent.com https://utfs.io https://*.ingest.uploadthing.com https://*.pusher.com https://pusher.pusherapp.com wss://*.pusher.com wss://pusher.pusherapp.com https://onesignal.com https://*.onesignal.com https://groq.com https://*.groq.com https://api.groq.com https://maps.googleapis.com https://va.vercel-scripts.com https://*.mapbox.com https://events.mapbox.com; worker-src 'self' blob:; child-src 'self' blob:; font-src 'self' data: https://fonts.gstatic.com;",
          },
        ],
      },
    ]
  },
}

export default nextConfig

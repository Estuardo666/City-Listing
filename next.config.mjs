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
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'fomento.culturaypatrimonio.gob.ec',
      },
      {
        protocol: 'https',
        hostname: 'api.mapbox.com',
      },
      {
        protocol: 'https',
        hostname: 'tiles.mapbox.com',
      },
      ...(process.env.R2_PUBLIC_HOSTNAME
        ? [
            {
              protocol: 'https',
              hostname: process.env.R2_PUBLIC_HOSTNAME,
            },
          ]
        : []),
      {
        protocol: 'https',
        hostname: 'pub-2c1df4902487c08164d8c0c8de048b47.r2.dev',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
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

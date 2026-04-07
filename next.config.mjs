import withPWAInit from '@ducanh2912/next-pwa'

const withPWA = withPWAInit({
  dest:            'public',          // output sw.js + workbox files to /public
  cacheOnFrontEndNav: true,           // cache navigations for instant back/forward
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,               // reload stale shell when back online
  disable:        process.env.NODE_ENV === 'development', // skip SW in dev
  workboxOptions: {
    disableDevLogs: true,
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    forceSwcTransforms: false,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
}

export default withPWA(nextConfig)

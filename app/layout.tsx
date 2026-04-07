import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default:  'Nigerent Signature Lifestyle',
    template: '%s · NSL',
  },
  description: 'A private member experience curated for guests who expect more.',
  manifest:    '/manifest.json',

  // iOS PWA
  appleWebApp: {
    capable:         true,
    statusBarStyle:  'black-translucent',
    title:           'NSL',
  },

  // Open Graph (for sharing / preview)
  openGraph: {
    type:        'website',
    title:       'Nigerent Signature Lifestyle',
    description: 'A private member experience curated for guests who expect more.',
    siteName:    'Nigerent Signature Lifestyle',
  },

  // Favicons
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png',   sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/icon-192.png',
  },

  // Don't let search engines index — private members app
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width:           'device-width',
  initialScale:    1,
  maximumScale:    1,
  userScalable:    false,
  themeColor:      [
    { media: '(prefers-color-scheme: dark)',  color: '#141f1f' },
    { media: '(prefers-color-scheme: light)', color: '#141f1f' },
  ],
  viewportFit:     'cover',   // critical — fills the notch / safe area on iOS
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Urbanist:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        {/* iOS splash / standalone tweaks */}
        <meta name="mobile-web-app-capable"      content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title"  content="NSL" />
        <meta name="application-name"            content="NSL" />
        <meta name="format-detection"            content="telephone=no" />
      </head>
      <body>{children}</body>
    </html>
  )
}

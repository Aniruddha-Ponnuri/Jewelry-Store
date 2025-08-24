import { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import { AuthSessionProvider } from '@/components/AuthSessionProvider'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Optimize font loading
  adjustFontFallback: false, // Disable font fallback adjustment
  preload: true,
})

export const metadata: Metadata = {
  metadataBase: new URL('https://jewelry-store-swart.vercel.app'),
  title: 'SilverPalace - Premium Silver Jewelry Collection',
  description: 'Discover our exquisite collection of fine silver jewelry, rings, necklaces, and precious gems crafted by Indian artisans.',
  keywords: 'silver jewelry, indian jewelry, rings, necklaces, earrings, bracelets, handcrafted',
  authors: [{ name: 'SilverPalace' }],
  creator: 'SilverPalace',
  publisher: 'SilverPalace',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://jewelry-store-swart.vercel.app',
    title: 'SilverPalace - Premium Silver Jewelry Collection',
    description: 'Discover our exquisite collection of fine silver jewelry, rings, necklaces, and precious gems crafted by Indian artisans.',
    siteName: 'SilverPalace',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SilverPalace - Premium Silver Jewelry Collection',
    description: 'Discover our exquisite collection of fine silver jewelry, rings, necklaces, and precious gems crafted by Indian artisans.',
  },
  alternates: {
    canonical: 'https://jewelry-store-swart.vercel.app',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  colorScheme: 'light dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <AuthSessionProvider>
            <div className="relative flex min-h-screen flex-col overflow-x-hidden">
              <Navigation />
              <main className="flex-1 w-full">{children}</main>
              <Footer />
            </div>
            <Toaster 
              position="bottom-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                },
              }}
            />
          </AuthSessionProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

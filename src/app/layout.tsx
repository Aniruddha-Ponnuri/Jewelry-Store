import { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Optimize font loading
  preload: true,
})

export const metadata: Metadata = {
  title: 'Silver Jewelry - Premium Silver Jewelry Collection',
  description: 'Discover our exquisite collection of fine silver jewelry, rings, necklaces, and precious gems crafted by Indian artisans.',
  keywords: 'silver jewelry, indian jewelry, rings, necklaces, earrings, bracelets, handcrafted',
  authors: [{ name: 'Silver Jewelry' }],
  creator: 'Silver Jewelry',
  publisher: 'Silver Jewelry',
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
    url: 'https://silver-jewelry.com',
    title: 'Silver Jewelry - Premium Silver Jewelry Collection',
    description: 'Discover our exquisite collection of fine silver jewelry, rings, necklaces, and precious gems crafted by Indian artisans.',
    siteName: 'Silver Jewelry',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Silver Jewelry - Premium Silver Jewelry Collection',
    description: 'Discover our exquisite collection of fine silver jewelry, rings, necklaces, and precious gems crafted by Indian artisans.',
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
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning={true}>
        <AuthProvider>
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
        </AuthProvider>
      </body>
    </html>
  )
}

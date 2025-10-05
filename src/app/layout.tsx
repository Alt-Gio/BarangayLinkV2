import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import ConvexClientProvider from '@/components/ConvexClientProvider'
import SessionTracker from '@/components/SessionTracker'
import { DatabaseConnectionProvider } from '@/components/common/DatabaseConnectionProvider'
import { DatabaseStatusIndicator } from '@/components/common/DatabaseStatusIndicator'
import { BottomNav } from '@/components/mobile/BottomNav'
import { InstallPrompt } from '@/components/mobile/InstallPrompt'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'BarangayLink v2 - Community Management System',
  description: 'Comprehensive community management platform with real-time collaboration, project management, and gamification features.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BarangayLink',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#10b981' },
    { media: '(prefers-color-scheme: dark)', color: '#1f2937' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_placeholder'}>
          <ConvexClientProvider>
            <DatabaseConnectionProvider>
              <SessionTracker />
              <DatabaseStatusIndicator />
              <div className="pb-16 md:pb-0">
                {children}
              </div>
              <BottomNav />
              <InstallPrompt />
            </DatabaseConnectionProvider>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
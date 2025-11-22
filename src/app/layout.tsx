import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ClerkOfflineProvider } from '@/components/providers/ClerkOfflineProvider'
import ConvexClientProvider from '@/components/ConvexClientProvider'
import SessionTracker from '@/components/SessionTracker'
import { DatabaseConnectionProvider } from '@/components/common/DatabaseConnectionProvider'
import { DatabaseStatusIndicator } from '@/components/common/DatabaseStatusIndicator'
import { BottomNav } from '@/components/mobile/BottomNav'
import { InstallPrompt } from '@/components/mobile/InstallPrompt'
import { PageTransition } from '@/components/common/PageTransition'
import { SidebarProvider } from '@/contexts/SidebarContext'
import { OfflineDataProvider } from '@/contexts/OfflineDataContext'
import { OfflineIndicator } from '@/components/OfflineIndicator'
import { OfflineDebugger } from '@/components/OfflineDebugger'
import { ServiceWorkerRegistration } from '@/components/common/ServiceWorkerRegistration'
import { env } from '@/config/env'
import { Toaster } from 'sonner'
import { PresenceTracker } from '@/components/common/PresenceTracker'
import { NotificationPermissionPrompt } from '@/components/notifications/NotificationPermissionPrompt'
import { NotificationListener } from '@/components/notifications/NotificationListener'

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
    startupImage: [
      {
        url: '/icons/icon-512x512.png',
        media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)',
      },
    ],
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
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
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'application-name': 'BarangayLink',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkOfflineProvider publishableKey={env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
          <ConvexClientProvider>
            <DatabaseConnectionProvider>
              <OfflineDataProvider>
                <SidebarProvider>
                  <PageTransition />
                  <PresenceTracker />
                  <SessionTracker />
                  <ServiceWorkerRegistration />
                  <NotificationPermissionPrompt />
                  <NotificationListener />
                  <div className="pb-16 md:pb-0">
                    {children}
                  </div>
                  <Toaster position="top-right" richColors />
                  <DatabaseStatusIndicator />
                  <OfflineIndicator />
                  <OfflineDebugger />
                  <BottomNav />
                  <InstallPrompt />
                </SidebarProvider>
              </OfflineDataProvider>
            </DatabaseConnectionProvider>
          </ConvexClientProvider>
        </ClerkOfflineProvider>
      </body>
    </html>
  )
}
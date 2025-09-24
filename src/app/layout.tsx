import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import ConvexClientProvider from '@/components/ConvexClientProvider'
import SessionTracker from '@/components/SessionTracker'
import { DatabaseConnectionProvider } from '@/components/common/DatabaseConnectionProvider'
import { DatabaseStatusIndicator } from '@/components/common/DatabaseStatusIndicator'

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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider>
          <ConvexClientProvider>
            <DatabaseConnectionProvider>
              <SessionTracker />
              <DatabaseStatusIndicator />
              {children}
            </DatabaseConnectionProvider>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
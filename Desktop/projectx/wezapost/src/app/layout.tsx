import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { SessionProvider } from '@/components/session-provider'

export const metadata: Metadata = {
  title: 'WezaPost - AI-Powered Social Media Management',
  description: 'Personal social media management tool with AI video generation capabilities',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="h-full font-mono bg-background text-foreground theme-transition">
        <SessionProvider>
          <ThemeProvider
            defaultTheme="system"
            storageKey="wezapost-theme"
          >
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
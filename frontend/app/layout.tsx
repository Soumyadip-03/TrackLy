import type React from "react"
import { Inter } from "next/font/google"
import { cn } from "@/lib/utils"
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/lib/auth-context"
import { AIChat } from "@/components/ai-chat"
import { ButtonConverter } from "@/components/ui/button-converter"
import { NotificationProvider } from "@/components/ui/notification-popup"
import { SessionPersistenceProvider } from "@/components/session-persistence"
import { ToastProvider } from "@/components/providers/toast-provider"
import { ConnectionErrorNotification } from "@/components/connection-error-notification"
import "./globals.css"

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "TrackLy - Attendance Tracker",
  description: "Track your attendance with ease",
  generator: 'TrackLy',
  icons: {
    icon: '/calendar-logo.svg'
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/calendar-logo.svg" />
      </head>
      <body className={cn(inter.className, "min-h-screen antialiased")}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ToastProvider>
            <NotificationProvider>
              <SessionPersistenceProvider>
                <AuthProvider>
                  <ConnectionErrorNotification />
                  {children}
                  <ButtonConverter />
                </AuthProvider>
              </SessionPersistenceProvider>
              <AIChat />
              <Toaster />
            </NotificationProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
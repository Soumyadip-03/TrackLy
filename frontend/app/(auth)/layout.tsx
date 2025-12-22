"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Calendar, MoonStar, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-background/95">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full animate-pulse-slow"></div>
              <div className="relative">
                <Calendar className="h-6 w-6 text-primary animate-spin-slow" />
              </div>
            </div>
            <div className="trackly-logo-container overflow-hidden">
              <span className="font-bold text-xl bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent animate-text-shimmer">
                TrackLy
              </span>
              <div className="logo-underline"></div>
            </div>
          </Link>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="rounded-full"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <MoonStar className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 container px-4 md:px-6">
        <div className="grid lg:grid-cols-2 min-h-[calc(100vh-4rem)]">
          {/* Left side: Auth forms */}
          <div className="flex flex-col justify-center py-12">
            {children}
          </div>
          
          {/* Right side: Illustration */}
          <div className="hidden lg:flex items-center justify-center p-12 relative bg-muted/40 rounded-l-3xl shadow-inner">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-background/5 rounded-l-3xl" />
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="relative z-10 max-w-lg"
            >
              <Image 
                src="/auth-illustration.svg" 
                alt="TrackLy Authentication" 
                width={500} 
                height={500}
                className="drop-shadow-xl"
                onError={(e) => {
                  // Fallback if image is not found
                  e.currentTarget.style.display = 'none'
                }}
              />
              <div className="mt-8 text-center">
                <h2 className="text-2xl font-bold tracking-tight">Track Your Attendance with Ease</h2>
                <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                  TrackLy helps you manage your academic life efficiently, 
                  so you can focus on what matters most - your education.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="container px-4 md:px-6 py-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} TrackLy. All rights reserved.
        </div>
      </footer>
    </div>
  )
} 
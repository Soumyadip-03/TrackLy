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
    <div className="flex h-screen flex-col bg-gradient-to-br from-background via-background to-background/95 overflow-hidden">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm flex-shrink-0">
        <div className="flex h-16 items-center justify-between px-6">
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
      <main className="flex-1 overflow-hidden">
        <div className="grid lg:grid-cols-2 h-full">
          {/* Left side: Auth forms */}
          <div className="flex flex-col justify-center items-center overflow-hidden">
            {children}
          </div>
          
          {/* Right side: Illustration */}
          <div className="hidden lg:flex items-center justify-center p-8 pl-2 pr-16">
            <div className="relative w-full h-full bg-muted/40 rounded-3xl shadow-inner overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-background/5" />
            
            {/* Floating background elements */}
            <motion.div
              className="absolute top-20 left-20 w-32 h-32 bg-primary/10 rounded-full blur-3xl"
              animate={{
                y: [0, -30, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute bottom-20 right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"
              animate={{
                y: [0, 30, 0],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            <div className="relative z-10 flex items-center justify-center h-full">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="max-w-lg"
              >
                <motion.div
                  animate={{
                    y: [0, -15, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Image 
                    src="/auth-illustration.svg" 
                    alt="TrackLy Authentication" 
                    width={500} 
                    height={500}
                    className="drop-shadow-2xl"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="mt-8 text-center"
                >
                  <h2 className="text-2xl font-bold tracking-tight">Track Your Attendance with Ease</h2>
                  <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                    TrackLy helps you manage your academic life efficiently, 
                    so you can focus on what matters most - your education.
                  </p>
                </motion.div>
              </motion.div>
            </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border/40 flex-shrink-0">
        <div className="px-6 py-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} TrackLy. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

"use client"

import { useState, useEffect, ReactNode } from "react"

interface ClientOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Only renders children on the client side to avoid hydration mismatches.
 * Use this to wrap components that rely on browser APIs like localStorage, window, etc.
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient ? children : fallback
} 
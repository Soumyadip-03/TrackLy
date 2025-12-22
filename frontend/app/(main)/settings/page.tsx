"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SettingsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to profile page
    router.replace("/profile")
  }, [router])

  return (
    <div className="container py-6 flex items-center justify-center">
      <p className="text-muted-foreground animate-pulse">Redirecting to Profile & Schedule...</p>
    </div>
  )
} 
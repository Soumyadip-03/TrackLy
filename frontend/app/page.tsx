"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
  }, [isLoading, user, router])

  return (
    <div className="container flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold">TrackLy</h1>
        <p className="text-muted-foreground mt-2">Loading...</p>
      </div>
    </div>
  )
} 
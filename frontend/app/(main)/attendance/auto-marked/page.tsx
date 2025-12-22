"use client"

import { PageHeader } from "@/components/page-header"
import { AutoMarkedAttendance } from "@/components/dashboard/auto-marked-attendance"
import { useEffect, useState } from "react"
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase/client'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from "next/navigation"

export default function AutoMarkedAttendancePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  
  // Ensure user is authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  // Show loading until we know authentication state
  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container py-8 space-y-6">
      <PageHeader 
        title="Auto-Marked Attendance" 
        description="View all classes that were automatically marked as present"
      />
      
      <div className="max-w-4xl mx-auto">
        <AutoMarkedAttendance />
      </div>
    </div>
  )
} 
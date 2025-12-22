'use client'

import React from 'react'
import { SupabaseTest } from '@/components/test/supabase-test'

export default function AuthTestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold text-center mb-8">Authentication Test</h1>
      <SupabaseTest />
    </div>
  )
}
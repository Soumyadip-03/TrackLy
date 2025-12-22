"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Processing authentication...')

  useEffect(() => {
    // Exchange the code for a session
    const handleAuthCallback = async () => {
      try {
        // Get the code from the URL
        const code = new URL(window.location.href).searchParams.get('code')
        
        if (code) {
          setStatus('Exchanging code for session...')
          console.log('Auth callback: Exchanging code for session')
          
          // Exchange the code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            console.error('Error exchanging code for session:', error)
            setStatus('Authentication failed. Redirecting to login...')
            setTimeout(() => router.push('/login?error=auth_failed'), 1000)
            return
          }
          
          // Verify the session was created
          if (data.session) {
            console.log('Auth callback: Session established successfully', data.session.user.id)
            setStatus('Authentication successful! Redirecting to dashboard...')
            
            // Store session data in localStorage for better reliability
            localStorage.setItem('supabase.auth.session', JSON.stringify({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              expires_at: data.session.expires_at,
              user: data.session.user
            }))
            
            // Set cookies for middleware to detect
            document.cookie = `auth-session=true; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
            document.cookie = `user-id=${data.session.user.id}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
            
            // Set a flag to indicate successful authentication (for temporary access)
            localStorage.setItem('just_logged_in', 'true')
            localStorage.setItem('login_timestamp', Date.now().toString())
            
            // Redirect to dashboard on successful authentication
            setTimeout(() => {
              window.location.href = '/dashboard?from_auth=true'
            }, 1000)
          } else {
            console.error('No session returned after code exchange')
            setStatus('Session creation failed. Redirecting to login...')
            setTimeout(() => router.push('/login?error=no_session'), 1000)
          }
        } else {
          // If no code is present, redirect to login
          console.warn('No code found in URL')
          setStatus('No authentication code found. Redirecting to login...')
          setTimeout(() => router.push('/login'), 1000)
        }
      } catch (error) {
        console.error('Error in auth callback:', error)
        router.push('/login?error=Authentication failed')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Completing authentication...</h1>
        <p className="text-muted-foreground">Please wait while we log you in.</p>
      </div>
    </div>
  )
}

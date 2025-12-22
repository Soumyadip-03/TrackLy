import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      console.log('Auth callback route: Exchanging code for session')
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        // Redirect to login with error
        return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_callback_error`)
      }
      
      if (data.session) {
        console.log('Auth callback route: Session established successfully')
        // Add a special parameter to indicate successful authentication
        return NextResponse.redirect(`${requestUrl.origin}/dashboard?from_auth=true`)
      } else {
        console.error('No session returned after code exchange')
        return NextResponse.redirect(`${requestUrl.origin}/login?error=no_session`)
      }
    } catch (error) {
      console.error('Error in auth callback route:', error)
      // Redirect to login with error
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_callback_error`)
    }
  }

  // If no code is present, redirect to login
  console.warn('No code found in URL')
  return NextResponse.redirect(`${requestUrl.origin}/login?error=no_code`)
}

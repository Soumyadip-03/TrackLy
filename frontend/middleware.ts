import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/admin-login'
]

const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/attendance',
  '/history',
  '/todo',
  '/notifications',
  '/about'
]

const STATIC_PATHS = [
  '/_next',
  '/api',
  '/favicon.ico',
  '/assets',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (STATIC_PATHS.some(path => pathname.includes(path))) {
    return NextResponse.next()
  }

  const token = request.cookies.get('trackly_token')?.value
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))

  if (pathname === '/') {
    return token
      ? NextResponse.redirect(new URL('/dashboard', request.url))
      : NextResponse.redirect(new URL('/login', request.url))
  }

  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public/|assets/|.*\\..*$).*)'
  ]
}

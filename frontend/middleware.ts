import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server'
export function middleware(request: NextRequest) {
  const hasRefreshToken = request.cookies.has('refresh_token')
  const { pathname } = request.nextUrl

  const isAuthPage = pathname === '/login' || pathname === '/register'
  const isDashboardPage = pathname.startsWith('/dashboard')

  // US-01 : Redirection vers la page de login si tentative d'accès au Dashboard SaaS sans session
  if (isDashboardPage && !hasRefreshToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname) // Expérience UX : Retour à la page demandée après auth
    return NextResponse.redirect(loginUrl)
  }

  // Si l'utilisateur est déjà authentifié, on lui interdit l'accès aux formulaires d'authentification
  if (isAuthPage && hasRefreshToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

// Configuration du Matcher pour cibler uniquement l'application SaaS et l'Auth
export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
}

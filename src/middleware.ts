import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Assume a user is not authenticated if there's no cookie
  const isAuthenticated = request.cookies.get('isAuthenticated')?.value === 'true'
  const { pathname } = request.nextUrl

  // If the user is not authenticated and trying to access any page other than the login page, redirect them.
  if (!isAuthenticated && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If the user is authenticated and trying to access the login page, redirect them to the home page.
  if (isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Matcher to specify which routes the middleware should run on.
  // We exclude api routes, static files, and image optimization routes.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

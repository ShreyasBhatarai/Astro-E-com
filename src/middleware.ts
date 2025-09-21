import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
    const isLoginRoute = req.nextUrl.pathname === '/login'
    const isRootRoute = req.nextUrl.pathname === '/'

    // Allow access to login page
    if (isLoginRoute) {
      return NextResponse.next()
    }

    // Check if user is trying to access admin routes
    if (isAdminRoute) {
      // If no token, redirect to login
      if (!token) {
        const loginUrl = new URL('/login', req.url)
        loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
        return NextResponse.redirect(loginUrl)
      }

      // Check if user has admin role
      if (token.role !== UserRole.ADMIN) {
        return NextResponse.redirect(new URL('/', req.url))
      }

    }

    // Only redirect to admin dashboard if coming from login or if explicitly requested
    // Allow admins to visit the home page if they navigate there directly
    if (isRootRoute && token && token.role === UserRole.ADMIN) {
      // Check if this is a redirect from login or if they have a specific intent to go to admin
      const referer = req.headers.get('referer')
      const isFromLogin = referer && referer.includes('/login')
      
      // Only auto-redirect to admin if coming from login
      if (isFromLogin) {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
        const isLoginRoute = req.nextUrl.pathname === '/login'
        const isApiRoute = req.nextUrl.pathname.startsWith('/api')

        // Allow login page and API routes
        if (isLoginRoute || isApiRoute) {
          return true
        }

        // For admin routes, require authentication
        if (isAdminRoute) {
          return !!token
        }

        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/',
  ],
}
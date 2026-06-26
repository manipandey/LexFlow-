import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/auth/callback',
  '/api/',
]

// Routes only accessible to clients (portal)
const PORTAL_ROUTES = ['/portal']

// Routes only accessible to firm staff
const STAFF_ROUTES = ['/dashboard', '/clients', '/cases', '/documents', '/hearings', '/tasks', '/team', '/billing', '/notifications', '/audit-logs', '/settings']

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Helper to preserve cookies
  const redirectWithCookies = (path: string) => {
    const url = new URL(path, request.url)
    if (path === '/login' && pathname !== '/login') {
      url.searchParams.set('redirectTo', pathname)
    }
    const response = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(cookie => {
      response.cookies.set(cookie.name, cookie.value, cookie)
    })
    return response
  }

  // Allow API routes to pass through completely
  if (pathname.startsWith('/api/')) {
    return supabaseResponse
  }

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    // If user is already logged in and tries to access auth pages, redirect to dashboard
    if (user && !pathname.startsWith('/auth/callback')) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error || !profile) {
        // If there's an error fetching the profile (e.g. no profile exists, or RLS error),
        // do not redirect to dashboard to avoid infinite loops.
        // Instead, clear the session or just let them stay on the auth page.
        await supabase.auth.signOut()
        // Explicitly clear cookies on the response to ensure browser drops them
        const cookiesToClear = ['sb-urqholuicaivcaidceyv-auth-token', 'supabase-auth-token']
        cookiesToClear.forEach(name => {
          supabaseResponse.cookies.delete(name)
        })
        return supabaseResponse
      }

      if (profile.role === 'client') {
        return redirectWithCookies('/portal')
      }
      return redirectWithCookies('/dashboard')
    }
    return supabaseResponse
  }

  // Unauthenticated: redirect to login
  if (!user) {
    return redirectWithCookies('/login')
  }

  // Get user role for route isolation
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, firm_id')
    .eq('id', user.id)
    .single()

  const role = profile?.role
  const firmId = profile?.firm_id

  // Client trying to access staff routes → redirect to portal
  if (role === 'client' && STAFF_ROUTES.some((r) => pathname.startsWith(r))) {
    return redirectWithCookies('/portal')
  }

  // Staff trying to access portal routes → redirect to dashboard
  if (role !== 'client' && PORTAL_ROUTES.some((r) => pathname.startsWith(r))) {
    return redirectWithCookies('/dashboard')
  }

  // User has no firm yet → redirect to onboarding (only for non-clients)
  if (!firmId && role !== 'client' && !pathname.startsWith('/onboarding')) {
    return redirectWithCookies('/onboarding')
  }

  // Root redirect
  if (pathname === '/') {
    if (role === 'client') {
      return redirectWithCookies('/portal')
    }
    return redirectWithCookies('/dashboard')
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

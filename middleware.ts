import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Route ownership map.
 *
 * member    → /home, /wallet, /rewards, /explore, /dining,
 *             /chat, /profile, /notifications, /bookings
 * concierge → /concierge
 * admin     → /admin
 *
 * Unauthenticated → /login
 * Wrong role      → redirect to own home silently
 */

const ROLE_HOME: Record<string, string> = {
  member:    '/home',
  concierge: '/concierge',
  admin:     '/admin',
}

function getRoleHome(role: string | undefined): string {
  return ROLE_HOME[role ?? ''] ?? '/home'
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set(name, value)
          supabaseResponse = NextResponse.next({ request })
          supabaseResponse.cookies.set(name, value, {
            ...options,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set(name, '')
          supabaseResponse = NextResponse.next({ request })
          supabaseResponse.cookies.set(name, '', {
            ...options,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // ── Always-public routes ──────────────────────────────────────────────────
  const isPublic =
    pathname === '/login' ||
    pathname === '/' ||
    pathname.startsWith('/invite') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/api/invites') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')

  if (isPublic) {
    // Logged-in user hitting /login → redirect to their home
    if (user && pathname === '/login') {
      const role = request.cookies.get('nsl-role')?.value
      return NextResponse.redirect(new URL(getRoleHome(role), request.url))
    }
    return supabaseResponse
  }

  // ── Not logged in → /login ────────────────────────────────────────────────
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('reason', 'session_expired')
    return NextResponse.redirect(url)
  }

  // ── Role from cookie (set at login) ───────────────────────────────────────
  const role = request.cookies.get('nsl-role')?.value ?? 'member'

  // ── Member routes  (/home, /wallet, /rewards, /explore, /dining, /chat,
  //                    /profile, /notifications, /bookings) ──────────────────
  const isMemberRoute =
    pathname.startsWith('/home') ||
    pathname.startsWith('/wallet') ||
    pathname.startsWith('/rewards') ||
    pathname.startsWith('/explore') ||
    pathname.startsWith('/dining') ||
    pathname.startsWith('/chat') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/bookings')

  if (isMemberRoute && role !== 'member') {
    return NextResponse.redirect(new URL(getRoleHome(role), request.url))
  }

  // ── Concierge routes  (/concierge) ────────────────────────────────────────
  const isConciergeRoute = pathname.startsWith('/concierge')

  if (isConciergeRoute && role !== 'concierge' && role !== 'admin') {
    return NextResponse.redirect(new URL(getRoleHome(role), request.url))
  }

  // ── Admin routes  (/admin) ────────────────────────────────────────────────
  const isAdminRoute = pathname.startsWith('/admin')

  if (isAdminRoute && role !== 'admin') {
    return NextResponse.redirect(new URL(getRoleHome(role), request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icon.*\\.png|.*\\.svg).*)',
  ],
}

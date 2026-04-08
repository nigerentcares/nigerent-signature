import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

const ROLE_HOME: Record<string, string> = {
  member:    '/home',
  concierge: '/concierge',
  admin:     '/admin',
}

// ── In-memory rate limiter ────────────────────────────────────────────────────
// 5 failed attempts per 15-minute window per IP.
const RATE_LIMIT  = 5
const WINDOW_MS   = 15 * 60 * 1000 // 15 minutes

interface RateEntry { count: number; resetAt: number }
const attempts = new Map<string, RateEntry>()

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

function checkRateLimit(ip: string): { limited: boolean; remaining: number; resetAt: number } {
  const now  = Date.now()
  const entry = attempts.get(ip)

  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 0, resetAt: now + WINDOW_MS })
    return { limited: false, remaining: RATE_LIMIT, resetAt: now + WINDOW_MS }
  }

  if (entry.count >= RATE_LIMIT) {
    return { limited: true, remaining: 0, resetAt: entry.resetAt }
  }

  return { limited: false, remaining: RATE_LIMIT - entry.count, resetAt: entry.resetAt }
}

function recordFailedAttempt(ip: string): void {
  const now  = Date.now()
  const entry = attempts.get(ip)
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
  } else {
    entry.count += 1
  }
}

function clearAttempts(ip: string): void {
  attempts.delete(ip)
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = checkRateLimit(ip)

  if (rl.limited) {
    const retryAfterSecs = Math.ceil((rl.resetAt - Date.now()) / 1000)
    return NextResponse.json(
      { error: 'too_many_attempts', retryAfter: retryAfterSecs },
      {
        status: 429,
        headers: {
          'Retry-After':       String(retryAfterSecs),
          'X-RateLimit-Limit': String(RATE_LIMIT),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  const body = await request.json()
  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  const cookieStore = await cookies()

  // Collect cookies to set — applied to the single final response after role lookup
  const cookiesToSet: Array<{ name: string; value: string; options: CookieOptions & { maxAge?: number } }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookiesToSet.push({ name, value, options })
        },
        remove(name: string, options: CookieOptions) {
          cookiesToSet.push({ name, value: '', options: { ...options, maxAge: 0 } })
        },
      },
    }
  )

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    recordFailedAttempt(ip)
    return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 })
  }

  // Successful login — clear the rate-limit counter
  clearAttempts(ip)

  // Fetch role from User table
  let role = 'member'
  try {
    const dbUser = await prisma.user.findUnique({
      where:  { id: data.user.id },
      select: { role: true },
    })
    if (dbUser?.role) role = dbUser.role
  } catch {
    // DB unreachable — default to member; don't block login
  }

  const redirectTo = ROLE_HOME[role] ?? '/home'

  // Build the ONE response with the correct redirect URL
  const response = NextResponse.json({ success: true, redirect: redirectTo })

  // Apply all Supabase session cookies captured during signInWithPassword
  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set(name, value, {
      ...options,
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/',
    })
  }

  // Set role cookie — read by middleware for route guards
  response.cookies.set('nsl-role', role, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
    maxAge:   60 * 60 * 24 * 7, // 7 days
  })

  return response
}

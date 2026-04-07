import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

const ROLE_HOME: Record<string, string> = {
  member:    '/home',
  concierge: '/concierge',
  admin:     '/admin',
}

export async function POST(request: NextRequest) {
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
    return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 })
  }

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

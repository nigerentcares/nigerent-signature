/**
 * POST /api/auth/change-password
 * Body: { currentPassword: string, newPassword: string }
 *
 * Verifies the current password by re-authenticating, then updates via
 * Supabase Auth's updateUser. This ensures the user can't change the password
 * without proving they know the current one.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z }                          from 'zod'
import { createClient }               from '@/lib/supabase/server'
import { createServerClient }         from '@supabase/ssr'
import { cookies }                    from 'next/headers'

const Schema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword:     z.string().min(8, 'New password must be at least 8 characters'),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid data' }, { status: 400 })
    }

    const { currentPassword, newPassword } = parsed.data

    if (currentPassword === newPassword) {
      return NextResponse.json({ error: 'New password must be different from your current password.' }, { status: 400 })
    }

    // Re-authenticate to verify current password
    const cookieStore = await cookies()
    const verifySb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value, set: () => {}, remove: () => {} } }
    )
    const { error: signInErr } = await verifySb.auth.signInWithPassword({
      email:    user.email!,
      password: currentPassword,
    })
    if (signInErr) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })
    }

    // Update the password
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword })
    if (updateErr) {
      return NextResponse.json({ error: updateErr.message ?? 'Could not update password.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('POST /api/auth/change-password error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

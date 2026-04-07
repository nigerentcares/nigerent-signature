import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Concierge layout — verifies session server-side.
 * Role guard lives in middleware; this is a belt-and-suspenders check.
 */
export default async function ConciergeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?reason=session_expired')

  return <div className="cp-shell">{children}</div>
}

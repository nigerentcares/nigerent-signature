import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ConciergeNav from '@/components/concierge/ConciergeNav'

/**
 * Concierge layout — mobile app shell with bottom nav.
 * Belt-and-suspenders session check (middleware also guards these routes).
 */
export default async function ConciergeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?reason=session_expired')

  return (
    <div className="con-app">
      <main className="con-main">{children}</main>
      <ConciergeNav />
    </div>
  )
}

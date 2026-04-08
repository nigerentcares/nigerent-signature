import { redirect }     from 'next/navigation'
import { createClient }  from '@/lib/supabase/server'
import ConciergeNav      from '@/components/concierge/ConciergeNav'

/**
 * Concierge layout — verifies session server-side and renders the
 * mobile-first dark shell with the bottom navigation bar.
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
    <div className="con-shell">
      {children}
      <ConciergeNav />
    </div>
  )
}

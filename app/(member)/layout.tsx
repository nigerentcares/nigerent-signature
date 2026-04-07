import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/member/BottomNav'

/**
 * Protected member layout.
 * - Verifies Supabase session server-side
 * - Renders the bottom navigation
 * - All /(member)/* routes use this shell
 */
export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?reason=session_expired')
  }

  return (
    <div className="app-shell">
      <main style={{ paddingBottom: 'max(90px, calc(72px + env(safe-area-inset-bottom)))' }}>
        {children}
      </main>
      <BottomNav />
    </div>
  )
}

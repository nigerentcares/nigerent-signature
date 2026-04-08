/**
 * /concierge — Requests tab
 *
 * Renders RequestsView (mobile-first) for the staff portal.
 * On desktop (≥900 px) the layout stretches to fill the viewport.
 */

import { redirect }    from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RequestsView     from '@/components/concierge/RequestsView'

export default async function ConciergePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?reason=session_expired')

  return <RequestsView />
}

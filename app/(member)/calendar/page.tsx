/**
 * /calendar — Member Itinerary Planner
 *
 * Server Component: auth guard only — all data fetching is done client-side
 * via CalendarClient for live interactivity.
 */

import { redirect }      from 'next/navigation'
import { createClient }  from '@/lib/supabase/server'
import CalendarClient    from '@/components/member/CalendarClient'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?reason=session_expired')

  return <CalendarClient />
}

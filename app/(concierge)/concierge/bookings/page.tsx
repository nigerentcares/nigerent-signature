import { redirect }    from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BookingsView     from '@/components/concierge/BookingsView'

export default async function BookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?reason=session_expired')

  return <BookingsView />
}

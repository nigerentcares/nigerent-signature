import { redirect }    from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MembersView      from '@/components/concierge/MembersView'

export default async function MembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?reason=session_expired')

  return <MembersView />
}

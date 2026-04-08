import { redirect }    from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileView      from '@/components/concierge/ProfileView'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?reason=session_expired')

  return <ProfileView />
}

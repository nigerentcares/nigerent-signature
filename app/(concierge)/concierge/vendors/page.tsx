import { redirect }    from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import VendorsView      from '@/components/concierge/VendorsView'

export default async function VendorsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?reason=session_expired')

  return <VendorsView />
}

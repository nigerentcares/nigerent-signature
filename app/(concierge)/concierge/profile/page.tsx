/**
 * /concierge/profile — Profile tab
 *
 * Concierge agent's own profile, activity stats, and sign-out.
 */

import { redirect }     from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma }       from '@/lib/prisma'
import ProfileView      from '@/components/concierge/ProfileView'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?reason=session_expired')

  const now       = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart  = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // Try to find AdminUser record for this agent
  const adminUser = await prisma.adminUser.findUnique({
    where: { email: user.email ?? '' },
  }).catch(() => null)

  // Stats: completed requests
  const [todayDone, weekDone, monthDone, totalOpen] = await Promise.all([
    prisma.conciergeRequest.count({
      where: { status: 'COMPLETED', resolvedAt: { gte: todayStart } },
    }),
    prisma.conciergeRequest.count({
      where: { status: 'COMPLETED', resolvedAt: { gte: weekStart } },
    }),
    prisma.conciergeRequest.count({
      where: { status: 'COMPLETED', resolvedAt: { gte: monthStart } },
    }),
    prisma.conciergeRequest.count({
      where: { status: { in: ['RECEIVED', 'IN_PROGRESS', 'AWAITING_UPDATE'] } },
    }),
  ])

  const profile = {
    id:        user.id,
    name:      adminUser?.name ?? user.email?.split('@')[0] ?? 'Concierge Agent',
    email:     user.email ?? '',
    role:      adminUser?.role ?? 'CONCIERGE_AGENT',
    lastLogin: adminUser?.lastLogin?.toISOString() ?? null,
    stats: {
      todayDone,
      weekDone,
      monthDone,
      totalOpen,
    },
  }

  return <ProfileView profile={profile} />
}

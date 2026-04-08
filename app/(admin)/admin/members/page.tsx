/**
 * /admin/members — Member Management
 * Server Component: full member list with tier, points, wallet balance.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import AdminShell from '@/components/admin/AdminShell'
import AdminMembersClient from '@/components/admin/AdminMembersClient'
import CreateUserButton from '@/components/admin/CreateUserButton'

async function getMembers() {
  const members = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      membership: { include: { tier: true } },
    },
  })

  // Fetch points and wallet balance for each member
  const enriched = await Promise.all(members.map(async (m) => {
    const [pointsAgg, walletAgg] = await Promise.all([
      prisma.pointsLedger.aggregate({ where: { userId: m.id }, _sum: { points: true } }),
      prisma.walletTransaction.aggregate({ where: { userId: m.id }, _sum: { amount: true } }),
    ])
    return {
      ...m,
      totalPoints: pointsAgg._sum.points ?? 0,
      walletBalance: walletAgg._sum.amount ?? 0,
    }
  }))

  return enriched
}


export default async function MembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?reason=session_expired')

  const members = await getMembers()

  // Serialise dates for client component
  const serialized = members.map(m => ({
    ...m,
    createdAt:   m.createdAt.toISOString(),
    updatedAt:   undefined,
    preferences: undefined,
    inviteToken: undefined,
    membership:  m.membership ? {
      tier:         m.membership.tier,
      memberNumber: m.membership.memberNumber,
    } : null,
  }))

  const plusEliteCount = members.filter(
    m => m.membership?.tier.slug === 'plus' || m.membership?.tier.slug === 'elite'
  ).length

  return (
    <AdminShell activeNav="members">
      <div className="adm-pg-hdr">
        <div>
          <div className="adm-pg-eye">Management</div>
          <div className="adm-pg-title">Members</div>
        </div>
        <CreateUserButton />
      </div>

      {/* Stats row */}
      <div className="adm-mini-stats">
        <div className="adm-mini-stat">
          <div className="adm-mini-val">{members.length}</div>
          <div className="adm-mini-lbl">Total</div>
        </div>
        <div className="adm-mini-stat">
          <div className="adm-mini-val">{members.filter(m => m.isActive).length}</div>
          <div className="adm-mini-lbl">Active</div>
        </div>
        <div className="adm-mini-stat">
          <div className="adm-mini-val">{plusEliteCount}</div>
          <div className="adm-mini-lbl">Plus &amp; Elite</div>
        </div>
      </div>

      {/* Live-search table */}
      <AdminMembersClient members={serialized} />
    </AdminShell>
  )
}

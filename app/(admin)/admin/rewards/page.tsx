/**
 * /admin/rewards — Rewards & Tier Configuration
 */

import { redirect }     from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma }       from '@/lib/prisma'
import AdminShell       from '@/components/admin/AdminShell'
import RewardsConfigClient from '@/components/admin/RewardsConfigClient'

async function getData() {
  const tiers = await prisma.membershipTier.findMany({
    orderBy: { displayOrder: 'asc' },
    include: { _count: { select: { memberships: true } } },
  })

  return tiers.map(t => ({
    id:              t.id,
    name:            t.name,
    slug:            t.slug,
    pointsThreshold: t.pointsThreshold,
    earnMultiplier:  t.earnMultiplier,
    benefits:        t.benefits as Record<string, unknown>,
    memberCount:     t._count.memberships,
    displayOrder:    t.displayOrder,
  }))
}

export default async function RewardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?reason=session_expired')

  const tiers = await getData()

  return (
    <AdminShell activeNav="rewards">
      <div className="adm-pg-hdr">
        <div>
          <div className="adm-pg-eye">Configuration</div>
          <div className="adm-pg-title">Rewards &amp; Tiers</div>
        </div>
      </div>
      <RewardsConfigClient tiers={tiers} />
    </AdminShell>
  )
}

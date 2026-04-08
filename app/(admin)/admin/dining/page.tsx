/**
 * /admin/dining — Manage dining reservation requests.
 * Server component: fetches all requests with restaurant + member info.
 */

import { redirect }   from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma }       from '@/lib/prisma'
import DiningRequestsClient from '@/components/admin/DiningRequestsClient'

export default async function AdminDiningPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') redirect('/login')

  const requests = await prisma.diningRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      restaurant: { select: { name: true, cuisine: true, area: true } },
      user:       { select: { name: true, email: true, phone: true } },
    },
  })

  const serialized = requests.map(r => ({
    ...r,
    preferredDate: r.preferredDate.toISOString(),
    createdAt:     r.createdAt.toISOString(),
    updatedAt:     r.updatedAt.toISOString(),
    confirmedAt:   r.confirmedAt?.toISOString() ?? null,
  }))

  return (
    <div className="adm-main">
      <div className="adm-topbar">
        <div>
          <div className="adm-topbar-title">Dining Reservations</div>
          <div className="adm-topbar-sub">Manage member dining requests</div>
        </div>
      </div>
      <div style={{ padding: 20 }}>
        <DiningRequestsClient initialRequests={serialized} />
      </div>
    </div>
  )
}

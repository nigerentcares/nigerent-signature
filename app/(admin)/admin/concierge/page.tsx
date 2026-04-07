/**
 * /admin/concierge — Concierge Request Queue
 * Server Component: fetches all requests, serialises dates, passes to AdminConciergeClient.
 */

import { redirect }              from 'next/navigation'
import { createClient }          from '@/lib/supabase/server'
import { prisma }                from '@/lib/prisma'
import AdminShell                from '@/components/admin/AdminShell'
import AdminConciergeClient, {
  type SerializedConciergeReq,
} from '@/components/admin/AdminConciergeClient'

async function getRequests() {
  return prisma.conciergeRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        include: {
          membership: { include: { tier: true } },
        },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })
}

export default async function ConciergePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?reason=session_expired')

  const raw = await getRequests()

  // Serialise dates → strings for client component
  const requests: SerializedConciergeReq[] = raw.map(r => ({
    id:          r.id,
    category:    r.category,
    description: r.description ?? '',
    status:      r.status,
    priority:    r.priority,
    createdAt:   r.createdAt.toISOString(),
    user: {
      id:    r.user.id,
      name:  r.user.name,
      email: r.user.email,
      tier:  r.user.membership?.tier?.name ?? null,
    },
    messages: r.messages.map(m => ({
      id:         m.id,
      senderRole: m.senderRole,
      body:       m.body,
      createdAt:  m.createdAt.toISOString(),
    })),
  }))

  const open       = requests.filter(r => r.status === 'RECEIVED').length
  const inProgress = requests.filter(r => r.status === 'IN_PROGRESS').length
  const resolved   = requests.filter(r => r.status === 'COMPLETED').length

  return (
    <AdminShell activeNav="concierge">
      <div className="adm-pg-hdr">
        <div>
          <div className="adm-pg-eye">Queue</div>
          <div className="adm-pg-title">Concierge Requests</div>
        </div>
        <div className="adm-hdr-actions">
          <div className="adm-cell-sub" style={{ fontSize: 12 }}>
            {open} open · {inProgress} in progress · {resolved} resolved
          </div>
        </div>
      </div>

      <AdminConciergeClient
        initialRequests={requests}
        totalLoaded={0}
        totalSpent={0}
      />
    </AdminShell>
  )
}

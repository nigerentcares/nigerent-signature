/**
 * /admin/invites — Invite Link Management
 * Server Component shell; interactive parts in InvitesClient.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import AdminShell from '@/components/admin/AdminShell'
import InvitesClient from '@/components/admin/InvitesClient'

async function getInvites() {
  return prisma.inviteLink.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}

export default async function InvitesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?reason=session_expired')

  const invites = await getInvites()

  const serialized = invites.map(i => ({
    ...i,
    createdAt:  i.createdAt.toISOString(),
    expiresAt:  i.expiresAt.toISOString(),
    usedAt:     i.usedAt?.toISOString() ?? null,
  }))

  return (
    <AdminShell activeNav="invites">
      <div className="adm-pg-hdr">
        <div>
          <div className="adm-pg-eye">Members</div>
          <div className="adm-pg-title">Invite Links</div>
        </div>
      </div>

      <InvitesClient initialInvites={serialized} />
    </AdminShell>
  )
}

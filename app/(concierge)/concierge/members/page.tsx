/**
 * /concierge/members — Members tab
 *
 * Server Component: fetches real member data with tiers and request counts.
 * Client sub-component handles search + member profile sheet.
 */

import { redirect }     from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma }       from '@/lib/prisma'
import MembersView      from '@/components/concierge/MembersView'

export default async function MembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?reason=session_expired')

  // Fetch all members with their tiers, request counts, and last chat message
  const members = await prisma.user.findMany({
    where: { role: 'member' },
    include: {
      membership: { include: { tier: true } },
      conciergeRequests: {
        where:  { status: { in: ['RECEIVED', 'IN_PROGRESS', 'AWAITING_UPDATE'] } },
        select: { id: true },
      },
      diningRequests: {
        where:  { status: { in: ['RECEIVED', 'IN_PROGRESS'] } },
        select: { id: true },
      },
      chatMessages: {
        orderBy: { createdAt: 'desc' },
        take:    1,
        select:  { createdAt: true, body: true, senderRole: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  const memberData = members.map(m => ({
    id:             m.id,
    name:           m.name,
    email:          m.email,
    phone:          m.phone ?? '',
    city:           m.city ?? '',
    tier:           m.membership?.tier?.name ?? 'Signature',
    activeRequests: m.conciergeRequests.length + m.diningRequests.length,
    lastMessage:    m.chatMessages[0]
      ? {
          body:     m.chatMessages[0].body.slice(0, 60),
          sentAt:   m.chatMessages[0].createdAt.toISOString(),
          fromRole: m.chatMessages[0].senderRole,
        }
      : null,
    preferences:    m.preferences,   // String[]
    joinedAt:       m.createdAt.toISOString(),
  }))

  return <MembersView members={memberData} />
}

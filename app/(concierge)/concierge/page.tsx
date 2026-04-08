/**
 * /concierge — Requests tab (default)
 *
 * Server Component: fetches all open dining + concierge requests.
 * Passes data to RequestsView (client) for interactive mobile handling.
 */

import { redirect }    from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma }       from '@/lib/prisma'
import RequestsView, { type RequestItem } from '@/components/concierge/RequestsView'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(date: Date): string {
  const now  = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ConciergePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?reason=session_expired')

  const [conciergeReqs, diningReqs] = await Promise.all([
    prisma.conciergeRequest.findMany({
      where:   { status: { in: ['RECEIVED', 'IN_PROGRESS', 'AWAITING_UPDATE'] } },
      include: {
        user: {
          include: {
            membership: { include: { tier: true } },
            walletTxns: {
              where:  { status: 'COMPLETED', type: { in: ['LOAD', 'REFUND', 'ADJUSTMENT'] } },
              select: { amount: true },
            },
            bookings: {
              orderBy: { checkIn: 'desc' },
              take:    5,
              select:  { id: true, property: true, checkIn: true, checkOut: true, status: true },
            },
          },
        },
        messages: { orderBy: { createdAt: 'asc' }, take: 50 },
      },
      orderBy: { createdAt: 'desc' },
    }),

    prisma.diningRequest.findMany({
      where:   { status: { in: ['RECEIVED', 'IN_PROGRESS'] } },
      include: {
        user: {
          include: {
            membership: { include: { tier: true } },
            walletTxns: {
              where:  { status: 'COMPLETED', type: { in: ['LOAD', 'REFUND', 'ADJUSTMENT'] } },
              select: { amount: true },
            },
            bookings: {
              orderBy: { checkIn: 'desc' },
              take:    5,
              select:  { id: true, property: true, checkIn: true, checkOut: true, status: true },
            },
          },
        },
        restaurant: { select: { name: true, cuisine: true } },
        messages:   { orderBy: { createdAt: 'asc' }, take: 50 },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const items: RequestItem[] = [
    ...conciergeReqs.map(r => {
      const loads = r.user.walletTxns.reduce((s, t) => s + t.amount, 0)
      return {
        id:          r.id,
        type:        'concierge' as const,
        category:    r.category,
        description: r.description ?? '',
        status:      r.status,
        priority:    r.priority,
        isUrgent:    r.priority === 'URGENT',
        timeAgo:     formatTime(r.createdAt),
        createdAt:   r.createdAt.toISOString(),
        member: {
          id:        r.user.id,
          name:      r.user.name,
          email:     r.user.email,
          tier:      r.user.membership?.tier?.name ?? 'Signature',
          walletNgn: Math.floor(loads / 100),
          bookings:  r.user.bookings.map(b => ({
            id:       b.id,
            property: b.property,
            checkIn:  b.checkIn.toISOString(),
            checkOut: b.checkOut.toISOString(),
            status:   b.status,
          })),
        },
        extra:    {},
        messages: r.messages.map(m => ({
          id:         m.id,
          senderRole: m.senderRole,
          body:       m.body,
          createdAt:  m.createdAt.toISOString(),
        })),
      }
    }),

    ...diningReqs.map(r => {
      const loads = r.user.walletTxns.reduce((s, t) => s + t.amount, 0)
      return {
        id:          r.id,
        type:        'dining' as const,
        category:    'Dining',
        description: `Table for ${r.partySize} at ${r.restaurant.name}`,
        status:      r.status,
        priority:    'STANDARD',
        isUrgent:    false,
        timeAgo:     formatTime(r.createdAt),
        createdAt:   r.createdAt.toISOString(),
        member: {
          id:        r.user.id,
          name:      r.user.name,
          email:     r.user.email,
          tier:      r.user.membership?.tier?.name ?? 'Signature',
          walletNgn: Math.floor(loads / 100),
          bookings:  r.user.bookings.map(b => ({
            id:       b.id,
            property: b.property,
            checkIn:  b.checkIn.toISOString(),
            checkOut: b.checkOut.toISOString(),
            status:   b.status,
          })),
        },
        extra: {
          restaurant:   r.restaurant.name,
          cuisine:      r.restaurant.cuisine ?? '',
          date:         r.preferredDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          time:         r.preferredTime,
          partySize:    r.partySize,
          occasion:     r.occasion ?? '',
          dietaryNotes: r.dietaryNotes ?? '',
          seatingPref:  r.seatingPref ?? '',
        },
        messages: r.messages.map(m => ({
          id:         m.id,
          senderRole: m.senderRole,
          body:       m.body,
          createdAt:  m.createdAt.toISOString(),
        })),
      }
    }),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const stats = {
    total:     items.length,
    urgent:    items.filter(i => i.isUrgent).length,
    dining:    items.filter(i => i.type === 'dining').length,
    concierge: items.filter(i => i.type === 'concierge').length,
  }

  return <RequestsView items={items} stats={stats} agentId={user.id} />
}

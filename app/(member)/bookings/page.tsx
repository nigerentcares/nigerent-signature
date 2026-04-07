/**
 * /bookings — Member Reservations
 *
 * Server Component: fetches stays, dining requests, concierge requests.
 * Serialises dates, passes to BookingsClient for tabbed rendering.
 */

import { redirect }    from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma }      from '@/lib/prisma'
import Link            from 'next/link'
import BookingsClient, {
  type SerializedBooking,
  type SerializedDiningReq,
  type SerializedConciergeReq,
} from '@/components/member/BookingsClient'

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function getBookingsData(userId: string) {
  const [stays, diningRaw, conciergeRaw] = await Promise.all([
    prisma.booking.findMany({
      where:   { userId },
      orderBy: { checkIn: 'desc' },
    }),

    prisma.diningRequest.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
      include: { restaurant: { select: { name: true } } },
    }),

    prisma.conciergeRequest.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const serializedStays: SerializedBooking[] = stays.map(s => ({
    id:        s.id,
    property:  s.property,
    checkIn:   s.checkIn.toISOString(),
    checkOut:  s.checkOut.toISOString(),
    amount:    s.amount,
    status:    s.status,
    createdAt: s.createdAt.toISOString(),
  }))

  const serializedDining: SerializedDiningReq[] = diningRaw.map(d => ({
    id:             d.id,
    restaurantName: d.restaurant.name,
    preferredDate:  d.preferredDate.toISOString(),
    preferredTime:  d.preferredTime,
    partySize:      d.partySize,
    occasion:       d.occasion ?? null,
    status:         d.status,
    createdAt:      d.createdAt.toISOString(),
  }))

  const serializedConcierge: SerializedConciergeReq[] = conciergeRaw.map(c => ({
    id:          c.id,
    category:    c.category,
    description: c.description ?? '',
    status:      c.status,
    priority:    c.priority,
    createdAt:   c.createdAt.toISOString(),
  }))

  return { serializedStays, serializedDining, serializedConcierge }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?reason=session_expired')

  const { serializedStays, serializedDining, serializedConcierge } =
    await getBookingsData(user.id)

  const totalActive =
    serializedStays.filter(s => new Date(s.checkIn) > new Date() && s.status.toLowerCase() !== 'cancelled').length +
    serializedDining.filter(d => !['COMPLETED','CANCELLED','DECLINED'].includes(d.status)).length +
    serializedConcierge.filter(c => !['COMPLETED','CANCELLED'].includes(c.status)).length

  return (
    <div style={{ background: '#0f1a1a', minHeight: '100dvh', paddingBottom: 100 }}>

      {/* ── Header ── */}
      <div style={{ padding: '28px 20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <Link
            href="/home"
            style={{ background: 'rgba(201,206,214,.06)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(201,206,214,.5)', textDecoration: 'none', flexShrink: 0 }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </Link>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 2 }}>
              My Account
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--cream)', display: 'flex', alignItems: 'center', gap: 8 }}>
              Reservations
              {totalActive > 0 && (
                <span style={{ background: 'var(--teal)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 20, verticalAlign: 'middle' }}>
                  {totalActive} active
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabbed content ── */}
      <BookingsClient
        stays={serializedStays}
        dining={serializedDining}
        concierge={serializedConcierge}
      />

    </div>
  )
}

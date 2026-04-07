import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma }       from '@/lib/prisma'

/**
 * GET /api/bookings
 * Returns the member's stays, dining requests, and concierge requests.
 * Used by the inline Bookings view inside the Concierge chat page.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [stays, diningRaw, conciergeRaw] = await Promise.all([
      prisma.booking.findMany({
        where:   { userId: user.id },
        orderBy: { checkIn: 'desc' },
      }),
      prisma.diningRequest.findMany({
        where:   { userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: { restaurant: { select: { name: true } } },
      }),
      prisma.conciergeRequest.findMany({
        where:   { userId: user.id },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return NextResponse.json({
      stays: stays.map(s => ({
        id:        s.id,
        property:  s.property,
        checkIn:   s.checkIn.toISOString(),
        checkOut:  s.checkOut.toISOString(),
        amount:    s.amount,
        status:    s.status,
        createdAt: s.createdAt.toISOString(),
      })),
      dining: diningRaw.map(d => ({
        id:             d.id,
        restaurantName: d.restaurant.name,
        preferredDate:  d.preferredDate.toISOString(),
        preferredTime:  d.preferredTime,
        partySize:      d.partySize,
        occasion:       d.occasion ?? null,
        status:         d.status,
        createdAt:      d.createdAt.toISOString(),
      })),
      concierge: conciergeRaw.map(c => ({
        id:          c.id,
        category:    c.category,
        description: c.description ?? '',
        status:      c.status,
        priority:    c.priority,
        createdAt:   c.createdAt.toISOString(),
      })),
    })
  } catch (err) {
    console.error('GET /api/bookings error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const BookSchema = z.object({
  restaurantId:   z.string().min(1),
  preferredDate:  z.string().min(1),   // ISO date string
  preferredTime:  z.string().min(1),   // e.g. "19:30"
  partySize:      z.number().int().min(1).max(50),
  occasion:       z.string().max(80).optional(),
  dietaryNotes:   z.string().max(300).optional(),
  seatingPref:    z.string().max(80).optional(),
  contactPref:    z.enum(['app', 'phone', 'whatsapp']).default('app'),
  additionalNotes:z.string().max(500).optional(),
})

/**
 * POST /api/dining/book
 * Creates a dining reservation request. Status begins as RECEIVED.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = BookSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid data', issues: parsed.error.issues }, { status: 400 })

    const data = parsed.data

    // Verify restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: data.restaurantId },
    })
    if (!restaurant || !restaurant.isActive) {
      return NextResponse.json({ error: 'Restaurant not found or inactive.' }, { status: 404 })
    }

    // Ensure user has a DB record
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const diningRequest = await prisma.diningRequest.create({
      data: {
        userId:          user.id,
        restaurantId:    data.restaurantId,
        preferredDate:   new Date(data.preferredDate),
        preferredTime:   data.preferredTime,
        partySize:       data.partySize,
        occasion:        data.occasion  ?? null,
        dietaryNotes:    data.dietaryNotes ?? null,
        seatingPref:     data.seatingPref  ?? null,
        contactPref:     data.contactPref,
        additionalNotes: data.additionalNotes ?? null,
        status:          'RECEIVED',
      },
    })

    // Notify the member
    await prisma.notification.create({
      data: {
        userId: user.id,
        type:   'DINING_UPDATE',
        title:  `Reservation request received — ${restaurant.name}`,
        body:   `Your table request for ${data.partySize} on ${new Date(data.preferredDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} at ${data.preferredTime} is being reviewed.`,
        ctaUrl: '/bookings',
      },
    })

    return NextResponse.json({ success: true, requestId: diningRequest.id, status: diningRequest.status })
  } catch (err) {
    console.error('POST /api/dining/book error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

/**
 * GET /api/dining/book  — member's own dining requests
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const requests = await prisma.diningRequest.findMany({
      where:   { userId: user.id },
      include: { restaurant: { select: { id: true, name: true, cuisine: true, area: true, city: true, imageUrls: true } } },
      orderBy: { createdAt: 'desc' },
      take:    20,
    })

    return NextResponse.json({ requests })
  } catch (err) {
    console.error('GET /api/dining/book error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

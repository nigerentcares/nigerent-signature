import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { awardPoints, EARN_RATES } from '@/lib/points'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, type, status } = await request.json()
  if (!id || !type || !status) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  try {
    if (type === 'dining') {
      const dining = await prisma.diningRequest.update({
        where: { id },
        data:  {
          status:      status as never,
          assignedTo:  user.id,
          confirmedAt: status === 'CONFIRMED' ? new Date() : undefined,
        },
      })

      // Award points when a dining reservation is confirmed
      if (status === 'CONFIRMED') {
        await awardPoints({
          userId:      dining.userId,
          actionType:  'DINING_CONFIRMED',
          points:      EARN_RATES.DINING_CONFIRMED,
          referenceId: dining.id,
        })

        // Fetch restaurant name for the notification
        const restaurant = await prisma.restaurant.findUnique({
          where: { id: dining.restaurantId },
          select: { name: true },
        })

        await prisma.notification.create({
          data: {
            userId: dining.userId,
            type:   'DINING_CONFIRMED',
            title:  `Reservation confirmed${restaurant ? ` — ${restaurant.name}` : ''}`,
            body:   `Your table for ${dining.partySize} is confirmed. You earned ${EARN_RATES.DINING_CONFIRMED} points!`,
            ctaUrl: '/bookings',
          },
        })
      }

      if (status === 'DECLINED') {
        await prisma.notification.create({
          data: {
            userId: dining.userId,
            type:   'DINING_DECLINED',
            title:  'Reservation could not be confirmed',
            body:   'Unfortunately your reservation could not be accommodated. Your concierge can help find an alternative.',
            ctaUrl: '/chat',
          },
        })
      }
    } else {
      const req = await prisma.conciergeRequest.update({
        where: { id },
        data:  {
          status:     status as never,
          assignedTo: user.id,
          resolvedAt: status === 'COMPLETED' ? new Date() : undefined,
        },
      })

      if (status === 'COMPLETED') {
        await prisma.notification.create({
          data: {
            userId: req.userId,
            type:   'CONCIERGE_RESOLVED',
            title:  'Your request has been completed',
            body:   `Your ${req.category} request has been resolved. Let us know if you need anything else.`,
            ctaUrl: '/chat',
          },
        })
      }
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('update-status error:', err)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { awardPoints } from '@/lib/points'

const Schema = z.object({
  offerId: z.string().min(1),
})

/**
 * POST /api/offers/redeem
 * Records an offer redemption (show-on-screen or code).
 * For CONCIERGE_CONFIRM, creates a ConciergeRequest instead.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

    const { offerId } = parsed.data

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { partner: { select: { name: true } } },
    })

    if (!offer || offer.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Offer not available.' }, { status: 404 })
    }

    // Check tier eligibility
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { membership: { include: { tier: true } } },
    })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const tierName = dbUser.membership?.tier?.name ?? 'Signature'
    if (offer.tierEligibility.length > 0 && !offer.tierEligibility.includes(tierName)) {
      return NextResponse.json({ error: 'Your membership tier is not eligible for this offer.' }, { status: 403 })
    }

    // For CONCIERGE_CONFIRM — create a concierge request
    if (offer.redemptionType === 'CONCIERGE_CONFIRM') {
      const conciergeReq = await prisma.conciergeRequest.create({
        data: {
          userId:      user.id,
          category:    'offer_redemption',
          description: `Member requesting redemption of offer: "${offer.title}" (${offer.partner.name})`,
          status:      'RECEIVED',
          priority:    'STANDARD',
        },
      })

      await prisma.notification.create({
        data: {
          userId: user.id,
          type:   'CONCIERGE_UPDATE',
          title:  'Offer redemption request sent',
          body:   `Your request to redeem "${offer.title}" has been sent to your concierge.`,
          ctaUrl: '/chat',
        },
      })

      return NextResponse.json({ success: true, type: 'CONCIERGE_CONFIRM', conciergeRequestId: conciergeReq.id })
    }

    // For SHOW_ON_SCREEN / CODE — record the redemption
    const redemption = await prisma.offerRedemption.create({
      data: { userId: user.id, offerId },
    })

    // Increment redemption count
    await prisma.offer.update({
      where: { id: offerId },
      data:  { redemptionCount: { increment: 1 } },
    })

    // Award points if eligible (via central engine — applies tier multiplier + tier-upgrade)
    let pointsAwarded = 0
    if (offer.pointsEligible && offer.pointsAward && offer.pointsAward > 0) {
      try {
        const entry = await awardPoints({
          userId:      user.id,
          actionType:  'OFFER_REDEMPTION',
          points:      offer.pointsAward,
          referenceId: redemption.id,
        })
        pointsAwarded = entry.points

        await prisma.notification.create({
          data: {
            userId: user.id,
            type:   'POINTS_EARNED',
            title:  `+${pointsAwarded} points earned!`,
            body:   `You earned ${pointsAwarded} points for redeeming "${offer.title}".`,
            ctaUrl: '/rewards',
          },
        })
      } catch (pointsErr) {
        console.error('Points awarding failed (redemption still valid):', pointsErr)
        // Redemption succeeded — points failure is non-blocking
      }
    }

    return NextResponse.json({
      success:       true,
      type:          offer.redemptionType,
      redemptionId:  redemption.id,
      code:          offer.redemptionCode,
      steps:         offer.redemptionSteps,
      pointsAwarded,
    })
  } catch (err) {
    console.error('POST /api/offers/redeem error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

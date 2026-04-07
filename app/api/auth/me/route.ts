import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/auth/me
 *
 * Returns the full member context: user profile, membership tier,
 * wallet balance, and points balance.
 * Required by all protected pages on initial load.
 */
const ProfileSchema = z.object({
  name:        z.string().min(1).max(80).optional(),
  phone:       z.string().max(20).optional().nullable(),
  city:        z.string().max(60).optional(),
  preferences: z.array(z.string()).optional(),
})

/**
 * PATCH /api/auth/me — update member profile
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = ProfileSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid data', issues: parsed.error.issues }, { status: 400 })

    const { name, phone, city, preferences } = parsed.data

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name        !== undefined ? { name }        : {}),
        ...(phone       !== undefined ? { phone }       : {}),
        ...(city        !== undefined ? { city }        : {}),
        ...(preferences !== undefined ? { preferences } : {}),
      },
    })

    return NextResponse.json({ success: true, name: updated.name, phone: updated.phone, city: updated.city, preferences: updated.preferences })
  } catch (err) {
    console.error('PATCH /api/auth/me error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user with membership + tier
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        membership: {
          include: { tier: true },
        },
      },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Derive points balance from ledger (always computed, never stored)
    const pointsAgg = await prisma.pointsLedger.aggregate({
      where: { userId: user.id },
      _sum:  { points: true },
    })
    const pointsBalance = pointsAgg._sum.points ?? 0

    // Derive wallet balance from transactions (always computed, never stored)
    const walletAgg = await prisma.walletTransaction.aggregate({
      where: {
        userId: user.id,
        status: 'COMPLETED',
        type:   { in: ['LOAD', 'REFUND', 'ADJUSTMENT'] },
      },
      _sum: { amount: true },
    })
    const walletLoads = walletAgg._sum.amount ?? 0

    const walletSpend = await prisma.walletTransaction.aggregate({
      where: {
        userId: user.id,
        status: 'COMPLETED',
        type:   'SPEND',
      },
      _sum: { amount: true },
    })
    const walletBalance = walletLoads - (walletSpend._sum.amount ?? 0)

    // Unread notification count
    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, readAt: null },
    })

    return NextResponse.json({
      id:           dbUser.id,
      name:         dbUser.name,
      email:        dbUser.email,
      phone:        dbUser.phone,
      city:         dbUser.city,
      preferences:  dbUser.preferences,
      avatarUrl:    dbUser.avatarUrl,
      role:         (user.user_metadata?.role as string | undefined) ?? 'member',
      membership: {
        memberNumber: dbUser.membership?.memberNumber,
        tier: {
          name:           dbUser.membership?.tier.name,
          slug:           dbUser.membership?.tier.slug,
          earnMultiplier: dbUser.membership?.tier.earnMultiplier,
          benefits:       dbUser.membership?.tier.benefits,
        },
      },
      points:       pointsBalance,
      // Balance returned in NGN (divide kobo by 100)
      walletBalance: Math.floor(walletBalance / 100),
      unreadCount,
    })
  } catch (err) {
    console.error('GET /api/auth/me error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

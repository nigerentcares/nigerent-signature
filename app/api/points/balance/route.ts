import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma }        from '@/lib/prisma'

/**
 * GET /api/points/balance
 *
 * Returns the authenticated member's current points balance,
 * derived from the PointsLedger aggregate sum (never stored).
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const agg = await prisma.pointsLedger.aggregate({
      where: { userId: user.id },
      _sum:  { points: true },
    })

    return NextResponse.json({ balance: agg._sum.points ?? 0 })
  } catch (err) {
    console.error('GET /api/points/balance error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

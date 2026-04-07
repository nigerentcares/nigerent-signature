import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma }        from '@/lib/prisma'

/**
 * GET /api/wallet/balance
 *
 * Returns the authenticated member's wallet balance in NGN.
 * Derived from WalletTransaction ledger (never stored).
 * Balance = sum(LOAD + REFUND + ADJUSTMENT) − sum(SPEND)  [completed only]
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [loads, spends] = await Promise.all([
      prisma.walletTransaction.aggregate({
        where: {
          userId: user.id,
          status: 'COMPLETED',
          type:   { in: ['LOAD', 'REFUND', 'ADJUSTMENT'] },
        },
        _sum: { amount: true },
      }),
      prisma.walletTransaction.aggregate({
        where: {
          userId: user.id,
          status: 'COMPLETED',
          type:   'SPEND',
        },
        _sum: { amount: true },
      }),
    ])

    // amount is stored in kobo; return NGN
    const balanceNgn = Math.floor(
      ((loads._sum.amount ?? 0) - (spends._sum.amount ?? 0)) / 100
    )

    return NextResponse.json({ balance: balanceNgn })
  } catch (err) {
    console.error('GET /api/wallet/balance error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

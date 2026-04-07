import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { awardPoints, walletLoadPoints } from '@/lib/points'

function isAdmin(user: { user_metadata?: Record<string, unknown> } | null) {
  return user?.user_metadata?.role === 'admin'
}

const Schema = z.object({
  txnId:  z.string().min(1),
  action: z.enum(['approve', 'reject']),
  note:   z.string().max(200).optional(),
})

/**
 * POST /api/admin/wallet/approve
 * Approve or reject a pending bank-transfer wallet load.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  const { txnId, action, note } = parsed.data

  const txn = await prisma.walletTransaction.findUnique({ where: { id: txnId } })
  if (!txn) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
  if (txn.status !== 'PENDING') return NextResponse.json({ error: 'Transaction is not pending' }, { status: 409 })

  const newStatus = action === 'approve' ? 'COMPLETED' : 'FAILED'
  const amountNGN = Math.floor(txn.amount / 100)

  await prisma.walletTransaction.update({
    where: { id: txnId },
    data:  {
      status:   newStatus,
      metadata: { ...(txn.metadata as Record<string, unknown> ?? {}), adminNote: note, reviewedBy: user.id },
    },
  })

  if (action === 'approve') {
    // Award points via central engine (applies tier multiplier + tier-upgrade check)
    const pts = walletLoadPoints(txn.amount)
    if (pts > 0) {
      await awardPoints({
        userId:      txn.userId,
        actionType:  'WALLET_LOAD',
        points:      pts,
        referenceId: txnId,
      })
    }

    // Notify member
    await prisma.notification.create({
      data: {
        userId: txn.userId,
        type:   'SYSTEM',
        title:  `₦${amountNGN.toLocaleString()} added to your wallet`,
        body:   `Your bank transfer has been confirmed and your wallet has been credited.`,
        ctaUrl: '/wallet',
      },
    })
  } else {
    await prisma.notification.create({
      data: {
        userId: txn.userId,
        type:   'SYSTEM',
        title:  'Transfer could not be confirmed',
        body:   note ?? 'We were unable to confirm your bank transfer. Please contact support if you believe this is an error.',
        ctaUrl: '/chat',
      },
    })
  }

  return NextResponse.json({ success: true, status: newStatus })
}

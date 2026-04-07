import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const MIN_KOBO = 1_000_000   // ₦10,000 in kobo
const MAX_KOBO = 200_000_000 // ₦2,000,000 in kobo

const Schema = z.object({
  amountNGN: z.number().int().positive(),
  narration: z.string().max(200).optional(),
})

/**
 * POST /api/wallet/load
 * Creates a PENDING bank-transfer wallet load.
 * Status stays PENDING until admin approves it in /admin/wallet.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

    const { amountNGN, narration } = parsed.data
    const amountKobo = amountNGN * 100

    if (amountKobo < MIN_KOBO || amountKobo > MAX_KOBO) {
      return NextResponse.json(
        { error: `Amount must be between ₦${MIN_KOBO / 100} and ₦${(MAX_KOBO / 100).toLocaleString()}` },
        { status: 400 }
      )
    }

    // Check for an already-pending load of the same amount in last 15 mins
    const recentPending = await prisma.walletTransaction.findFirst({
      where: {
        userId:    user.id,
        type:      'LOAD',
        status:    'PENDING',
        amount:    amountKobo,
        createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
      },
    })
    if (recentPending) {
      return NextResponse.json(
        { success: true, txnId: recentPending.id, duplicate: true, message: 'A pending load for this amount already exists.' },
        { status: 200 }
      )
    }

    const txn = await prisma.walletTransaction.create({
      data: {
        userId:        user.id,
        type:          'LOAD',
        status:        'PENDING',
        amount:        amountKobo,
        description:   `Wallet top-up – bank transfer`,
        paymentMethod: 'bank_transfer',
        metadata:      narration ? { narration } : undefined,
      },
    })

    // Create a matching notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type:   'SYSTEM',
        title:  'Top-up pending review',
        body:   `Your ₦${amountNGN.toLocaleString()} wallet top-up is being reviewed. It will reflect within 1–2 business hours.`,
        ctaUrl: '/wallet',
      },
    })

    return NextResponse.json({ success: true, txnId: txn.id })
  } catch (err) {
    console.error('POST /api/wallet/load error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

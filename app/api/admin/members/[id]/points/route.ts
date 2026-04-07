/**
 * POST /api/admin/members/[id]/points
 * Admin: manually award (positive) or deduct (negative) points for a member.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { awardPoints, getBalance } from '@/lib/points'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  if (admin?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json() as { points: number; reason: string }
  const { points, reason } = body

  if (!points || !reason?.trim()) {
    return NextResponse.json({ error: 'points and reason are required' }, { status: 400 })
  }

  const memberId = params.id
  const member = await prisma.user.findUnique({ where: { id: memberId }, select: { id: true, name: true } })
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  const actionType = points > 0 ? 'MANUAL_AWARD' as const : 'MANUAL_DEDUCT' as const

  const entry = await awardPoints({
    userId:        memberId,
    actionType,
    points,
    createdBy:     user.id,
    adminNote:     reason.trim(),
    skipTierCheck: points <= 0,   // no upgrade check on deductions
  })

  const newBalance = await getBalance(memberId)

  // Push an in-app notification to the member
  await prisma.notification.create({
    data: {
      userId: memberId,
      type:   'POINTS_AWARDED',
      title:  points > 0 ? '🎁 Points Added' : '📉 Points Adjusted',
      body:   points > 0
        ? `${points.toLocaleString()} points were added to your account. Reason: ${reason.trim()}`
        : `${Math.abs(points).toLocaleString()} points were deducted from your account. Reason: ${reason.trim()}`,
    },
  })

  return NextResponse.json({ entry, newBalance })
}

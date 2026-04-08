/**
 * PATCH /api/admin/rewards/[id] — update a membership tier's thresholds and earn rate
 */

import { NextRequest, NextResponse } from 'next/server'
import { z }                          from 'zod'
import { createClient }               from '@/lib/supabase/server'
import { prisma }                     from '@/lib/prisma'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  return dbUser?.role === 'admin' ? user : null
}

const TierSchema = z.object({
  pointsThreshold: z.number().int().min(0).optional(),
  earnMultiplier:  z.number().min(0.1).max(10).optional(),
  benefits:        z.record(z.unknown()).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const parsed = TierSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data', issues: parsed.error.issues }, { status: 400 })

  const tier = await prisma.membershipTier.update({
    where: { id },
    data:  {
      pointsThreshold: parsed.data.pointsThreshold,
      earnMultiplier:  parsed.data.earnMultiplier,
      benefits:        parsed.data.benefits as any,
    },
  })

  return NextResponse.json({ tier })
}

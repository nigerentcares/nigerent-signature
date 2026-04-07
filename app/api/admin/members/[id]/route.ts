/**
 * PATCH /api/admin/members/[id]
 * Admin: update a member's name, phone, or tier.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { setTierManually } from '@/lib/tiers'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  if (admin?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json() as {
    name?:     string
    phone?:    string
    tierSlug?: string
    isActive?: boolean
  }

  const memberId = params.id

  // Update basic profile fields
  const profileUpdate: Record<string, unknown> = {}
  if (body.name?.trim())  profileUpdate.name    = body.name.trim()
  if (body.phone !== undefined) profileUpdate.phone = body.phone?.trim() || null
  if (body.isActive !== undefined) profileUpdate.isActive = body.isActive

  if (Object.keys(profileUpdate).length > 0) {
    await prisma.user.update({ where: { id: memberId }, data: profileUpdate })
  }

  // Update tier if requested
  if (body.tierSlug) {
    await setTierManually(memberId, body.tierSlug, user.id, 'Admin override')
  }

  // Return the refreshed member record
  const updated = await prisma.user.findUnique({
    where: { id: memberId },
    select: {
      id: true, name: true, email: true, phone: true,
      city: true, role: true, isActive: true, createdAt: true,
      membership: {
        select: {
          memberNumber: true,
          tier: { select: { name: true, slug: true } },
        },
      },
      pointsLedger: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { balanceAfter: true },
      },
    },
  })

  return NextResponse.json({ member: updated })
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

function isAdmin(user: { user_metadata?: Record<string, unknown> } | null) {
  return user?.user_metadata?.role === 'admin'
}

const PatchSchema = z.object({
  partnerId:       z.string().min(1).optional(),
  title:           z.string().min(1).max(120).optional(),
  shortDesc:       z.string().max(120).optional(),
  description:     z.string().min(1).optional(),
  category:        z.enum(['DINING', 'WELLNESS', 'NIGHTLIFE', 'EVENTS', 'TRANSPORT', 'SHOPPING', 'STAYS', 'SERVICES']).optional(),
  city:            z.string().optional(),
  area:            z.string().optional(),
  tierEligibility: z.array(z.string()).optional(),
  pointsEligible:  z.boolean().optional(),
  pointsAward:     z.number().int().nonnegative().optional().nullable(),
  redemptionType:  z.enum(['SHOW_ON_SCREEN', 'CODE', 'CONCIERGE_CONFIRM']).optional(),
  redemptionCode:  z.string().optional(),
  redemptionSteps: z.array(z.string()).optional(),
  termsConditions: z.string().optional(),
  imageUrl:        z.string().optional(),
  validFrom:       z.string().optional().transform(s => s ? new Date(s) : undefined),
  validTo:         z.string().optional().nullable().transform(s => s ? new Date(s) : null),
  status:          z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
  isFeatured:      z.boolean().optional(),
  displayOrder:    z.number().int().optional(),
})

/**
 * PATCH /api/admin/offers/[id]
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data', issues: parsed.error.issues }, { status: 400 })

  // Remove undefined keys
  const updateData = Object.fromEntries(
    Object.entries(parsed.data).filter(([, v]) => v !== undefined)
  )

  const offer = await prisma.offer.update({
    where: { id: params.id },
    data: updateData,
    include: { partner: true },
  })

  return NextResponse.json({ success: true, offer })
}

/**
 * DELETE /api/admin/offers/[id] — archives the offer (soft delete)
 */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.offer.update({
    where: { id: params.id },
    data: { status: 'ARCHIVED' },
  })

  return NextResponse.json({ success: true })
}

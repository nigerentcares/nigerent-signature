import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

function isAdmin(user: { user_metadata?: Record<string, unknown> } | null) {
  return user?.user_metadata?.role === 'admin'
}

const OfferSchema = z.object({
  partnerId:       z.string().min(1),
  title:           z.string().min(1).max(120),
  shortDesc:       z.string().max(120),
  description:     z.string().min(1),
  category:        z.enum(['DINING', 'WELLNESS', 'NIGHTLIFE', 'EVENTS', 'TRANSPORT', 'SHOPPING', 'STAYS', 'SERVICES']),
  city:            z.string().default('Lagos'),
  area:            z.string().optional(),
  tierEligibility: z.array(z.string()).min(1),
  pointsEligible:  z.boolean().default(false),
  pointsAward:     z.number().int().nonnegative().optional(),
  redemptionType:  z.enum(['SHOW_ON_SCREEN', 'CODE', 'CONCIERGE_CONFIRM']).default('SHOW_ON_SCREEN'),
  redemptionCode:  z.string().optional(),
  redemptionSteps: z.array(z.string()).default([]),
  termsConditions: z.string().optional(),
  imageUrl:        z.string().url().optional().or(z.literal('')),
  validFrom:       z.string().transform(s => new Date(s)),
  validTo:         z.string().optional().transform(s => s ? new Date(s) : null),
  status:          z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED']).default('DRAFT'),
  isFeatured:      z.boolean().default(false),
  displayOrder:    z.number().int().optional(),
})

/**
 * POST /api/admin/offers — create a new offer
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = OfferSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data', issues: parsed.error.issues }, { status: 400 })

  const data = parsed.data
  const offer = await prisma.offer.create({
    data: {
      ...data,
      imageUrl:     data.imageUrl || null,
      redemptionSteps: data.redemptionSteps,
    },
    include: { partner: true },
  })

  return NextResponse.json({ success: true, offer })
}

/**
 * GET /api/admin/offers — list all offers with partner
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const offers = await prisma.offer.findMany({
    orderBy: { createdAt: 'desc' },
    include: { partner: true },
  })

  const partners = await prisma.partner.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ offers, partners })
}

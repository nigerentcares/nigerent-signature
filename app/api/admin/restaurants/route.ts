import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

function isAdmin(user: { user_metadata?: Record<string, unknown> } | null) {
  return user?.user_metadata?.role === 'admin'
}

const RestaurantSchema = z.object({
  name:             z.string().min(1),
  cuisine:          z.string().min(1),
  city:             z.string().default('Lagos'),
  area:             z.string().min(1),
  description:      z.string().optional(),
  imageUrls:        z.array(z.string()).default([]),
  ambianceTags:     z.array(z.string()).default([]),
  memberBenefit:    z.string().optional(),
  priceLevel:       z.number().int().min(1).max(4).default(2),
  openingHours:     z.record(z.string()).default({}),
  reservationNotes: z.string().optional(),
  mapLink:          z.string().url().optional().or(z.literal('')),
  isActive:         z.boolean().default(true),
  isFeatured:       z.boolean().default(false),
})

/**
 * GET /api/admin/restaurants
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const restaurants = await prisma.restaurant.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { diningRequests: true } },
    },
  })

  return NextResponse.json({ restaurants })
}

/**
 * POST /api/admin/restaurants — create restaurant
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = RestaurantSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data', issues: parsed.error.issues }, { status: 400 })

  const restaurant = await prisma.restaurant.create({
    data: {
      ...parsed.data,
      mapLink: parsed.data.mapLink || null,
    },
  })

  return NextResponse.json({ success: true, restaurant })
}

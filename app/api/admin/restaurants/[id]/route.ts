import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

function isAdmin(user: { user_metadata?: Record<string, unknown> } | null) {
  return user?.user_metadata?.role === 'admin'
}

const PatchSchema = z.object({
  name:             z.string().min(1).optional(),
  cuisine:          z.string().optional(),
  city:             z.string().optional(),
  area:             z.string().optional(),
  description:      z.string().optional(),
  imageUrls:        z.array(z.string()).optional(),
  ambianceTags:     z.array(z.string()).optional(),
  memberBenefit:    z.string().optional(),
  priceLevel:       z.number().int().min(1).max(4).optional(),
  openingHours:     z.record(z.string()).optional(),
  reservationNotes: z.string().optional(),
  mapLink:          z.string().optional(),
  isActive:         z.boolean().optional(),
  isFeatured:       z.boolean().optional(),
})

/**
 * PATCH /api/admin/restaurants/[id]
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  const updateData = Object.fromEntries(
    Object.entries(parsed.data).filter(([, v]) => v !== undefined)
  )

  const restaurant = await prisma.restaurant.update({
    where: { id: params.id },
    data: updateData,
  })

  return NextResponse.json({ success: true, restaurant })
}

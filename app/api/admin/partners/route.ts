/**
 * GET  /api/admin/partners — list all partners
 * POST /api/admin/partners — create a new partner
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

const PartnerSchema = z.object({
  name:        z.string().min(1).max(120),
  category:    z.string().min(1),
  city:        z.string().default('Lagos'),
  area:        z.string().optional(),
  description: z.string().optional(),
  imageUrl:    z.string().url().optional().or(z.literal('')),
  isActive:    z.boolean().default(true),
  contactInfo: z.object({
    phone:   z.string().optional(),
    email:   z.string().email().optional(),
    website: z.string().url().optional().or(z.literal('')),
    address: z.string().optional(),
    rating:  z.number().min(0).max(5).optional(),
  }).optional(),
})

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const partners = await prisma.partner.findMany({
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    include: { _count: { select: { offers: true } } },
  })

  return NextResponse.json({ partners })
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = PartnerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', issues: parsed.error.issues }, { status: 400 })
  }

  const { name, category, city, area, description, imageUrl, isActive, contactInfo } = parsed.data

  const existing = await prisma.partner.findUnique({ where: { name } })
  if (existing) return NextResponse.json({ error: 'A partner with this name already exists.' }, { status: 409 })

  const partner = await prisma.partner.create({
    data: { name, category, city, area: area ?? null, description: description ?? null, imageUrl: imageUrl || null, isActive, contactInfo: contactInfo ?? {} },
  })

  return NextResponse.json({ partner }, { status: 201 })
}

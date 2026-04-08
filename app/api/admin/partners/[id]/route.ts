/**
 * PATCH  /api/admin/partners/[id] — update partner
 * DELETE /api/admin/partners/[id] — soft-delete (set isActive = false)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient }               from '@/lib/supabase/server'
import { prisma }                     from '@/lib/prisma'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  return dbUser?.role === 'admin' ? user : null
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json() as Record<string, unknown>

  const partner = await prisma.partner.update({
    where: { id },
    data:  {
      name:        typeof body.name        === 'string' ? body.name        : undefined,
      category:    typeof body.category    === 'string' ? body.category    : undefined,
      city:        typeof body.city        === 'string' ? body.city        : undefined,
      area:        typeof body.area        === 'string' ? body.area        : undefined,
      description: typeof body.description === 'string' ? body.description : undefined,
      imageUrl:    typeof body.imageUrl    === 'string' ? body.imageUrl || null : undefined,
      isActive:    typeof body.isActive    === 'boolean' ? body.isActive   : undefined,
      contactInfo: body.contactInfo !== undefined ? (body.contactInfo as object) : undefined,
    },
  })

  return NextResponse.json({ partner })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  await prisma.partner.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ success: true })
}

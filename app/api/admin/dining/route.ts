import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

function isAdmin(user: { user_metadata?: Record<string, unknown> } | null) {
  return user?.user_metadata?.role === 'admin'
}

/**
 * GET /api/admin/dining
 * Lists all dining requests with restaurant + member info.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const requests = await prisma.diningRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      restaurant: { select: { name: true, cuisine: true, area: true } },
      user:       { select: { name: true, email: true, phone: true } },
    },
  })

  return NextResponse.json({ requests })
}

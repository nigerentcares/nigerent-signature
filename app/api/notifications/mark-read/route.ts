/**
 * DEPRECATED — use POST /api/notifications/read instead.
 * This endpoint is kept only to avoid 404s from any cached clients.
 * It proxies to the canonical endpoint.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma }       from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as { ids?: string[] }

  const where = body.ids?.length
    ? { userId: user.id, id: { in: body.ids }, readAt: null }
    : { userId: user.id, readAt: null }

  const { count } = await prisma.notification.updateMany({
    where,
    data: { readAt: new Date() },
  })

  return NextResponse.json({ success: true, marked: count })
}

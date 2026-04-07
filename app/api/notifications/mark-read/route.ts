/**
 * POST /api/notifications/mark-read
 * Marks all (or specific) notifications as read.
 * Body: { ids?: string[] }  — omit `ids` to mark all unread.
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

  return NextResponse.json({ marked: count })
}

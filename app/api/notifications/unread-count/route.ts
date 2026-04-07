/**
 * GET /api/notifications/unread-count
 * Returns the number of unread notifications for the current member.
 * Used by BottomNav to drive the badge.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma }       from '@/lib/prisma'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ count: 0 })

  const count = await prisma.notification.count({
    where: { userId: user.id, readAt: null },
  })

  return NextResponse.json({ count })
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const Schema = z.object({
  ids: z.array(z.string()).optional(), // if omitted → mark all as read
})

/**
 * POST /api/notifications/read
 * Body: { ids?: string[] }
 * If ids omitted, marks all unread notifications for the user as read.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  const { ids } = parsed.data
  const now = new Date()

  await prisma.notification.updateMany({
    where: {
      userId: user.id,
      readAt: null,
      ...(ids?.length ? { id: { in: ids } } : {}),
    },
    data: { readAt: now },
  })

  return NextResponse.json({ success: true })
}

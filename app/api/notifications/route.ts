import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const TYPE_MAP: Record<string, string[]> = {
  offers:    ['OFFER_NEW', 'OFFER_EXPIRING'],
  concierge: ['CONCIERGE_UPDATE', 'CONCIERGE_RESOLVED'],
  dining:    ['DINING_UPDATE', 'DINING_CONFIRMED', 'DINING_DECLINED'],
  system:    ['SYSTEM', 'WELCOME', 'POINTS_EARNED', 'TIER_UPGRADE'],
}

/**
 * GET /api/notifications?filter=all|offers|concierge|dining|system
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') ?? 'all'

  const typeFilter = TYPE_MAP[filter]

  const notifications = await prisma.notification.findMany({
    where: {
      userId: user.id,
      ...(typeFilter ? { type: { in: typeFilter } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 80,
  })

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, readAt: null },
  })

  return NextResponse.json({ notifications, unreadCount })
}

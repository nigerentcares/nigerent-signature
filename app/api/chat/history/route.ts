/**
 * GET /api/chat/history
 * Returns the member's past concierge and dining requests.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [conciergeReqs, diningReqs] = await Promise.all([
    prisma.conciergeRequest.findMany({
      where:   { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take:    20,
    }),
    prisma.diningRequest.findMany({
      where:   { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take:    10,
      include: { restaurant: { select: { name: true } } },
    }),
  ])

  const CAT_EMOJI: Record<string, string> = {
    Dining:          '🍽️',
    Transport:       '🚗',
    Events:          '🎟️',
    Gifts:           '🎁',
    Recommendations: '✦',
    'Stay Support':  '🏠',
    Errands:         '📦',
    Custom:          '💬',
  }

  const items = [
    ...conciergeReqs.map(r => ({
      id:          r.id,
      type:        'concierge' as const,
      emoji:       CAT_EMOJI[r.category] ?? '💬',
      category:    r.category,
      title:       r.description ?? r.category,
      status:      r.status,
      createdAt:   r.createdAt.toISOString(),
    })),
    ...diningReqs.map(r => ({
      id:          r.id,
      type:        'dining' as const,
      emoji:       '🍽️',
      category:    'Dining',
      title:       `${r.restaurant.name} — ${r.partySize} guests${r.occasion ? ' · ' + r.occasion : ''}`,
      status:      r.status,
      createdAt:   r.createdAt.toISOString(),
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json({ items })
}

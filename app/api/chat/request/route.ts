/**
 * POST /api/chat/request
 * Member submits a structured concierge request.
 * Creates ConciergeRequest + ChatMessage + system notification.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const CATEGORY_MAP: Record<string, string> = {
  dining:    'Dining',
  transport: 'Transport',
  events:    'Events',
  gifts:     'Gifts',
  recs:      'Recommendations',
  stay:      'Stay Support',
  errands:   'Errands',
  custom:    'Custom',
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { category, description, date, time, contactPref, priority } = await request.json()

  if (!category || !description?.trim()) {
    return NextResponse.json({ error: 'Category and description are required' }, { status: 400 })
  }

  const catLabel = CATEGORY_MAP[category] ?? 'Custom'
  const isUrgent = priority === 'urgent'

  // Create ConciergeRequest
  const req = await prisma.conciergeRequest.create({
    data: {
      userId:      user.id,
      category:    catLabel,
      description: description.trim(),
      priority:    isUrgent ? 'URGENT' : 'STANDARD',
      status:      'RECEIVED',
    },
  })

  // Attach as chat message in the member's thread
  let thread = await prisma.chatThread.findUnique({ where: { userId: user.id } })
  if (!thread) {
    thread = await prisma.chatThread.create({ data: { userId: user.id } })
  }

  await prisma.chatMessage.create({
    data: {
      threadId:          thread.id,
      userId:            user.id,
      senderRole:        'MEMBER',
      body:              description.trim(),
      conciergeRequestId: req.id,
    },
  })

  // System acknowledgment message
  await prisma.chatMessage.create({
    data: {
      threadId:          thread.id,
      userId:            user.id,
      senderRole:        'SYSTEM',
      body:              `Your ${catLabel} request has been received. A member of our concierge team will follow up ${isUrgent ? 'within 30 minutes' : 'within 2 hours'}.`,
      conciergeRequestId: req.id,
    },
  })

  // Notification for the member
  await prisma.notification.create({
    data: {
      userId: user.id,
      type:   'CONCIERGE_REQUEST',
      title:  'Request Received',
      body:   `Your ${catLabel} request is with our concierge team.`,
      ctaUrl: '/chat',
    },
  }).catch(() => {/* non-critical */})

  return NextResponse.json({ success: true, requestId: req.id, ref: `NSL-${req.id.slice(0, 8).toUpperCase()}` })
}

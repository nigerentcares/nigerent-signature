/**
 * POST /api/chat/send
 * Member sends a message to their concierge thread.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { body } = await request.json()
  if (!body?.trim()) {
    return NextResponse.json({ error: 'Message body is required' }, { status: 400 })
  }

  // Get or create thread
  let thread = await prisma.chatThread.findUnique({ where: { userId: user.id } })
  if (!thread) {
    thread = await prisma.chatThread.create({ data: { userId: user.id } })
  }

  const msg = await prisma.chatMessage.create({
    data: {
      threadId:   thread.id,
      userId:     user.id,
      senderRole: 'MEMBER',
      body:       body.trim(),
    },
  })

  return NextResponse.json({
    id:         msg.id,
    senderRole: msg.senderRole,
    body:       msg.body,
    createdAt:  msg.createdAt.toISOString(),
  })
}

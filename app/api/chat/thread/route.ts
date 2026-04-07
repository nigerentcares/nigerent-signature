/**
 * GET /api/chat/thread
 * Returns the current member's chat thread + last 50 messages.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get or create thread
  let thread = await prisma.chatThread.findUnique({
    where: { userId: user.id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 100,
      },
    },
  })

  if (!thread) {
    thread = await prisma.chatThread.create({
      data: { userId: user.id },
      include: { messages: true },
    })
  }

  return NextResponse.json({
    threadId: thread.id,
    messages: thread.messages.map(m => ({
      id:         m.id,
      senderRole: m.senderRole,
      body:       m.body,
      createdAt:  m.createdAt.toISOString(),
      readAt:     m.readAt?.toISOString() ?? null,
    })),
  })
}

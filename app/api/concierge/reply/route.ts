import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { requestId, requestType, memberId, body } = await request.json()
  if (!requestId || !requestType || !memberId || !body?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  try {
    // Ensure the member has a ChatThread
    let thread = await prisma.chatThread.findUnique({ where: { userId: memberId } })
    if (!thread) {
      thread = await prisma.chatThread.create({ data: { userId: memberId } })
    }

    // Create the message
    const msg = await prisma.chatMessage.create({
      data: {
        threadId:          thread.id,
        userId:            memberId,
        senderRole:        'CONCIERGE',
        body:              body.trim(),
        ...(requestType === 'dining'
          ? { diningRequestId: requestId }
          : { conciergeRequestId: requestId }
        ),
      },
    })

    // Notify the member
    await prisma.notification.create({
      data: {
        userId:  memberId,
        type:    'CONCIERGE_REPLY',
        title:   'Message from your Concierge',
        body:    body.trim().slice(0, 120),
        metadata: { requestId, requestType },
      },
    }).catch(() => {/* non-critical */})

    return NextResponse.json({
      id:         msg.id,
      senderRole: msg.senderRole,
      body:       msg.body,
      createdAt:  msg.createdAt.toISOString(),
    })
  } catch (err) {
    console.error('concierge reply error:', err)
    return NextResponse.json({ error: 'Send failed' }, { status: 500 })
  }
}

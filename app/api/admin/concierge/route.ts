/**
 * GET /api/admin/concierge
 * Returns all concierge requests (admin only), optionally filtered by status.
 *
 * Query params:
 *   status  — RECEIVED | IN_PROGRESS | AWAITING_UPDATE | COMPLETED | CANCELLED
 *   limit   — max records (default 100)
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma }       from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Admin guard
  const role = user.user_metadata?.role
  if (role !== 'admin' && role !== 'concierge') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const limit  = Math.min(parseInt(searchParams.get('limit') ?? '100', 10), 200)

  const raw = await prisma.conciergeRequest.findMany({
    where:   status ? { status: status as never } : undefined,
    orderBy: { createdAt: 'desc' },
    take:    limit,
    include: {
      user: {
        include: {
          membership: { include: { tier: true } },
        },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  const requests = raw.map(r => ({
    id:          r.id,
    category:    r.category,
    description: r.description ?? '',
    status:      r.status,
    priority:    r.priority,
    createdAt:   r.createdAt.toISOString(),
    user: {
      id:    r.user.id,
      name:  r.user.name,
      email: r.user.email,
      tier:  r.user.membership?.tier?.name ?? null,
    },
    messages: r.messages.map(m => ({
      id:         m.id,
      senderRole: m.senderRole,
      body:       m.body,
      createdAt:  m.createdAt.toISOString(),
    })),
  }))

  const counts = {
    total:      raw.length,
    received:   raw.filter(r => r.status === 'RECEIVED').length,
    inProgress: raw.filter(r => r.status === 'IN_PROGRESS').length,
    awaiting:   raw.filter(r => r.status === 'AWAITING_UPDATE').length,
    completed:  raw.filter(r => r.status === 'COMPLETED').length,
  }

  return NextResponse.json({ requests, counts })
}

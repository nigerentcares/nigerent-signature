/**
 * /api/calendar — CRUD for CalendarEvent
 *
 * GET  ?from=ISO&to=ISO           — fetch events for current user (or any member for concierge)
 * POST body: { title, description, date, time, endTime, type, restaurantId, userId? }
 * DELETE ?id=eventId
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// ── GET ────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const from  = searchParams.get('from')
  const to    = searchParams.get('to')
  // Concierge/admin can pass ?userId= to read any member's calendar
  const targetUserId = searchParams.get('userId') ?? user.id

  // Only concierge/admin can query other members
  if (targetUserId !== user.id) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
    if (!dbUser || dbUser.role === 'member') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const events = await prisma.calendarEvent.findMany({
    where: {
      userId: targetUserId,
      ...(from || to ? {
        date: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to   ? { lte: new Date(to)   } : {}),
        },
      } : {}),
    },
    include: {
      restaurant: { select: { name: true, area: true, city: true } },
    },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
  })

  return NextResponse.json({ events })
}

// ── POST ───────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, description, date, time, endTime, type, restaurantId, userId: targetUserId } = body

  if (!title || !date) {
    return NextResponse.json({ error: 'title and date are required' }, { status: 400 })
  }

  // If concierge is adding to another member's calendar
  const ownerId = targetUserId ?? user.id
  if (ownerId !== user.id) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
    if (!dbUser || dbUser.role === 'member') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const event = await prisma.calendarEvent.create({
    data: {
      userId:      ownerId,
      title,
      description: description ?? null,
      date:        new Date(date),
      time:        time ?? null,
      endTime:     endTime ?? null,
      type:        type ?? 'PERSONAL',
      restaurantId: restaurantId ?? null,
      createdBy:   user.id,
    },
    include: {
      restaurant: { select: { name: true, area: true, city: true } },
    },
  })

  return NextResponse.json({ event }, { status: 201 })
}

// ── DELETE ─────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const event = await prisma.calendarEvent.findUnique({ where: { id } })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Member can only delete their own; concierge/admin can delete any
  if (event.userId !== user.id) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
    if (!dbUser || dbUser.role === 'member') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  await prisma.calendarEvent.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

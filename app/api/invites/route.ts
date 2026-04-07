import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma'

// ─────────────────────────────
// POST /api/invites
// Admin-only: generate a new invite link
// ─────────────────────────────

const CreateInviteSchema = z.object({
  email:      z.string().email(),
  expiryDays: z.number().int().min(1).max(90).default(14),
})

export async function POST(req: NextRequest) {
  // Verify the caller is an admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = CreateInviteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data.' }, { status: 400 })
  }

  const { email, expiryDays } = parsed.data

  // Check invite not already sent to this email (pending)
  const existing = await prisma.inviteLink.findFirst({
    where: {
      email,
      usedAt:    null,
      expiresAt: { gt: new Date() },
    },
  })

  if (existing) {
    return NextResponse.json(
      { error: 'An active invite already exists for this email.', token: existing.token },
      { status: 409 }
    )
  }

  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)

  const invite = await prisma.inviteLink.create({
    data: {
      email,
      expiresAt,
      createdBy: user.id,
    },
  })

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invite.token}`

  // TODO Layer 10: send invite email via Resend
  // await sendInviteEmail({ to: email, inviteUrl, expiryDays })

  return NextResponse.json({
    success:   true,
    token:     invite.token,
    inviteUrl,
    expiresAt: invite.expiresAt,
  })
}

// ─────────────────────────────
// GET /api/invites
// Admin-only: list all invite links
// ─────────────────────────────

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const invites = await prisma.inviteLink.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({ invites })
}

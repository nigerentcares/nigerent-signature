import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'

// ─────────────────────────────
// Validation schema
// ─────────────────────────────

const SignupSchema = z.object({
  token:       z.string().min(1),
  email:       z.string().email(),
  firstName:   z.string().min(1).max(50),
  lastName:    z.string().min(1).max(50),
  phone:       z.string().optional(),
  password:    z.string().min(8).max(128),
  preferences: z.array(z.string()).default([]),
  city:        z.enum(['Lagos', 'Abuja']).default('Lagos'),
})

// ─────────────────────────────
// POST /api/auth/signup
// ─────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = SignupSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid signup data.', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { token, email, firstName, lastName, phone, password, preferences, city } =
      parsed.data

    // ── 1. Verify the invite token ──
    const invite = await prisma.inviteLink.findUnique({
      where: { token },
    })

    if (!invite) {
      return NextResponse.json({ error: 'Invalid invite token.' }, { status: 400 })
    }
    if (invite.usedAt) {
      return NextResponse.json({ error: 'This invite has already been used.' }, { status: 400 })
    }
    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This invite link has expired.' }, { status: 400 })
    }
    if (invite.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: 'Email does not match invite.' }, { status: 400 })
    }

    // ── 2. Check email not already registered ──
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      )
    }

    // ── 3. Create Supabase Auth user ──
    const supabase = createAdminClient()
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // auto-confirm since they came via invite
      user_metadata: { role: 'member' },
    })

    if (authError || !authData.user) {
      console.error('Supabase auth error:', authError)
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      )
    }

    const supabaseUserId = authData.user.id

    // ── 4. Fetch the Signature tier (base tier for all new members) ──
    const signatureTier = await prisma.membershipTier.findUnique({
      where: { slug: 'signature' },
    })

    if (!signatureTier) {
      // Tier not seeded yet — create it on the fly
      await seedTiers()
    }

    const tier = await prisma.membershipTier.findUnique({
      where: { slug: 'signature' },
    })

    if (!tier) {
      return NextResponse.json({ error: 'Membership tier not configured.' }, { status: 500 })
    }

    // ── 5. Transactional DB writes ──
    const WELCOME_POINTS = 500

    const result = await prisma.$transaction(async (tx) => {
      // Create User record (id matches Supabase Auth uid)
      const user = await tx.user.create({
        data: {
          id:           supabaseUserId,
          email,
          name:         `${firstName} ${lastName}`,
          phone:        phone ? `+234${phone.replace(/^0/, '').replace(/\s/g, '')}` : null,
          city,
          preferences,
          inviteToken:       token,
          inviteActivatedAt: new Date(),
          invitedBy:         invite.createdBy,
        },
      })

      // Create UserMembership
      const membership = await tx.userMembership.create({
        data: {
          userId: user.id,
          tierId: tier.id,
        },
      })

      // Create Wallet
      await tx.wallet.create({
        data: { userId: user.id },
      })

      // Create ChatThread (one persistent thread per member)
      await tx.chatThread.create({
        data: { userId: user.id },
      })

      // Award welcome points via PointsLedger
      await tx.pointsLedger.create({
        data: {
          userId:       user.id,
          actionType:   'WELCOME_BONUS',
          points:       WELCOME_POINTS,
          balanceAfter: WELCOME_POINTS,
        },
      })

      // Mark invite as used
      await tx.inviteLink.update({
        where: { token },
        data:  { usedAt: new Date() },
      })

      // Create welcome notification
      await tx.notification.create({
        data: {
          userId: user.id,
          type:   'WELCOME',
          title:  'Welcome to Nigerent Signature Lifestyle',
          body:   `Your membership is active. You've been awarded ${WELCOME_POINTS} welcome points.`,
          ctaUrl: '/rewards',
        },
      })

      return { user, membership }
    })

    return NextResponse.json({
      success:      true,
      memberNumber: result.membership.memberNumber,
      tier:         tier.name,
      points:       WELCOME_POINTS,
    })
  } catch (err) {
    console.error('Signup error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

// ─────────────────────────────
// Seed tiers if not present (dev utility)
// ─────────────────────────────

async function seedTiers() {
  await prisma.membershipTier.createMany({
    data: [
      {
        name:             'Signature',
        slug:             'signature',
        pointsThreshold:  0,
        earnMultiplier:   1.0,
        displayOrder:     1,
        benefits:         [
          'Access to all partner offers',
          'Priority dining reservations',
          'Concierge support (2hr response)',
          'Member wallet',
          '5 points per ₦1,000 on stays',
        ],
      },
      {
        name:             'Signature Plus',
        slug:             'plus',
        pointsThreshold:  2500,
        earnMultiplier:   1.5,
        displayOrder:     2,
        benefits:         [
          'Everything in Signature',
          '1.5× points on all spend',
          'Exclusive Plus-only offers',
          'Priority concierge (1hr response)',
          'Complimentary airport transfer (monthly)',
        ],
      },
      {
        name:             'Elite',
        slug:             'elite',
        pointsThreshold:  5000,
        earnMultiplier:   2.0,
        displayOrder:     3,
        benefits:         [
          'Everything in Signature Plus',
          '2× points on all spend',
          'Dedicated personal concierge',
          'Elite-only events & previews',
          'Complimentary airport transfer (weekly)',
          'Room upgrade on stays (subject to availability)',
        ],
      },
    ],
    skipDuplicates: true,
  })
}

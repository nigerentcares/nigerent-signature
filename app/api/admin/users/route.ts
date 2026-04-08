/**
 * POST /api/admin/users — directly create a member or concierge account
 * (No invite flow — admin sets all fields including password)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z }                          from 'zod'
import { createClient }               from '@/lib/supabase/server'
import { createAdminClient }          from '@/lib/supabase/admin'
import { prisma }                     from '@/lib/prisma'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  return dbUser?.role === 'admin' ? user : null
}

const CreateUserSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName:  z.string().min(1).max(50),
  email:     z.string().email(),
  password:  z.string().min(8).max(128),
  role:      z.enum(['member', 'concierge']),
  phone:     z.string().optional(),
  city:      z.enum(['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan']).default('Lagos'),
})

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = CreateUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', issues: parsed.error.issues }, { status: 400 })
  }

  const { firstName, lastName, email, password, role, phone, city } = parsed.data
  const fullName = `${firstName} ${lastName}`

  // Check if user already exists in Prisma
  const existingDb = await prisma.user.findUnique({ where: { email } })
  if (existingDb) return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 })

  const adminSb = createAdminClient()

  // 1. Create Supabase auth user
  const { data: authData, error: authErr } = await adminSb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,   // auto-confirm, no email verification needed
    user_metadata: { name: fullName, role },
  })

  if (authErr || !authData.user) {
    return NextResponse.json({ error: authErr?.message ?? 'Failed to create auth user.' }, { status: 500 })
  }

  const authUserId = authData.user.id

  try {
    // 2. Find the default (lowest) tier
    const defaultTier = await prisma.membershipTier.findFirst({
      orderBy: { pointsThreshold: 'asc' },
    })

    // 3. Create Prisma user record
    const dbUser = await prisma.user.create({
      data: {
        id:    authUserId,
        email,
        name:  fullName,
        phone: phone ?? null,
        city,
        role:  role as 'member' | 'concierge',
        membership: role === 'member' && defaultTier ? {
          create: {
            tierId: defaultTier.id,
          },
        } : undefined,
        wallet: role === 'member' ? { create: {} } : undefined,
      },
      include: { membership: { include: { tier: true } } },
    })

    // 4. Welcome bonus points for members
    if (role === 'member') {
      await prisma.pointsLedger.create({
        data: {
          userId:       authUserId,
          actionType:   'WELCOME_BONUS',
          points:       500,
          balanceAfter: 500,
          adminNote:    'Account created by admin',
          createdBy:    admin.id,
        },
      })

      await prisma.notification.create({
        data: {
          userId: authUserId,
          type:   'SYSTEM',
          title:  'Welcome to Signature Lifestyle',
          body:   `Your account has been created. You've received 500 welcome points to get started.`,
          ctaUrl: '/home',
        },
      })
    }

    return NextResponse.json({
      success: true,
      user: {
        id:           dbUser.id,
        name:         dbUser.name,
        email:        dbUser.email,
        role:         dbUser.role,
        city:         dbUser.city,
        memberNumber: dbUser.membership?.memberNumber ?? null,
        tier:         dbUser.membership?.tier.name ?? null,
      },
    }, { status: 201 })
  } catch (err) {
    // Rollback auth user if DB creation fails
    await adminSb.auth.admin.deleteUser(authUserId)
    console.error('POST /api/admin/users error:', err)
    return NextResponse.json({ error: 'Failed to create user record.' }, { status: 500 })
  }
}

/**
 * Creates a test member account directly, bypassing the invite flow.
 * Run once from the project root:
 *
 *   node create-test-user.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'

const SUPABASE_URL     = 'https://xmrxgbhrlxsflauvzjde.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtcnhnYmhybHhzZmxhdXZ6amRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTUyNTE4NCwiZXhwIjoyMDkxMTAxMTg0fQ.JwPXhzDwOUKSYCd1oqX0mrjzvu_yJ_cRkFPjbqbG30w'

const TEST_EMAIL    = 'oye@nigerent.test'
const TEST_PASSWORD = 'Signature2024!'
const TEST_NAME     = 'Oye Nigerent'
const TEST_PHONE    = '+2348000000001'

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Uses DIRECT_URL (no pgbouncer) for Prisma scripts
const prisma = new PrismaClient()

async function main() {
  console.log('🔧  Creating test member account…\n')

  // 1. Check if user already exists in Supabase
  const { data: listData } = await supabaseAdmin.auth.admin.listUsers()
  const existing = listData?.users?.find(u => u.email === TEST_EMAIL)

  let authUserId

  if (existing) {
    console.log(`ℹ️   Auth user already exists (${existing.id}), resetting password…`)
    await supabaseAdmin.auth.admin.updateUserById(existing.id, { password: TEST_PASSWORD })
    authUserId = existing.id
  } else {
    // Create Supabase auth user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email:          TEST_EMAIL,
      password:       TEST_PASSWORD,
      email_confirm:  true,
    })
    if (error) throw new Error(`Supabase auth error: ${error.message}`)
    authUserId = data.user.id
    console.log(`✅  Supabase auth user created: ${authUserId}`)
  }

  // 2. Seed tier if missing
  let tier = await prisma.membershipTier.findFirst({ where: { slug: 'signature-plus' } })
  if (!tier) {
    tier = await prisma.membershipTier.create({
      data: {
        name:            'Signature Plus',
        slug:            'signature-plus',
        earnMultiplier:  1.5,
        benefits:        ['Priority reservations', 'Welcome drink at partner restaurants', '20% off select spa bookings'],
        pointsThreshold: 0,
        displayOrder:    1,
      },
    })
    console.log('✅  Seeded Signature Plus tier')
  }

  // 3. Check if DB user already exists
  const dbUserExists = await prisma.user.findUnique({ where: { id: authUserId } })
  if (dbUserExists) {
    console.log('ℹ️   DB user record already exists — skipping DB creation.')
    console.log('\n─────────────────────────────────────')
    console.log('🎉  LOGIN CREDENTIALS')
    console.log(`    Email:    ${TEST_EMAIL}`)
    console.log(`    Password: ${TEST_PASSWORD}`)
    console.log('─────────────────────────────────────\n')
    await prisma.$disconnect()
    return
  }

  // 5. Create all DB records in a transaction
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        id:          authUserId,
        email:       TEST_EMAIL,
        name:        TEST_NAME,
        phone:       TEST_PHONE,
        city:        'Lagos',
        preferences: ['Dining', 'Wellness', 'Nightlife'],
      },
    })

    await tx.userMembership.create({
      data: { userId: user.id, tierId: tier.id },
    })

    await tx.wallet.create({ data: { userId: user.id } })

    await tx.chatThread.create({ data: { userId: user.id } })

    // Welcome points — field names must match schema exactly
    await tx.pointsLedger.create({
      data: {
        userId:       user.id,
        actionType:   'WELCOME_BONUS',
        points:       500,
        balanceAfter: 500,
      },
    })

    await tx.notification.create({
      data: {
        userId: user.id,
        type:   'WELCOME',
        title:  'Welcome to Signature Lifestyle',
        body:   "Your membership is active. You've been awarded 500 welcome points.",
        ctaUrl: '/rewards',
      },
    })
  })

  console.log('✅  All DB records created')
  console.log('\n─────────────────────────────────────')
  console.log('🎉  LOGIN CREDENTIALS')
  console.log(`    Email:    ${TEST_EMAIL}`)
  console.log(`    Password: ${TEST_PASSWORD}`)
  console.log('─────────────────────────────────────\n')
  console.log('Go to http://localhost:3001/login and sign in!')

  await prisma.$disconnect()
}

main().catch(err => {
  console.error('❌  Error:', err.message)
  process.exit(1)
})

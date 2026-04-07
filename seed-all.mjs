/**
 * seed-all.mjs
 * Seeds test member accounts + membership tiers + concierge/dining requests.
 * Run with: node seed-all.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'

const SUPABASE_URL     = 'https://xmrxgbhrlxsflauvzjde.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtcnhnYmhybHhzZmxhdXZ6amRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTUyNTE4NCwiZXhwIjoyMDkxMTAxMTg0fQ.JwPXhzDwOUKSYCd1oqX0mrjzvu_yJ_cRkFPjbqbG30w'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres.xmrxgbhrlxsflauvzjde:I3G5OE4JQKMnvzih@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true' } },
})

// ── 1. Ensure membership tiers exist ─────────────────────────────────────────

async function ensureTiers() {
  const tiers = [
    { name: 'Signature',       slug: 'signature',       pointsThreshold: 0,    earnMultiplier: 1.0, displayOrder: 1, benefits: { lounge: false, priority: false, elite: false } },
    { name: 'Signature Plus',  slug: 'signature-plus',  pointsThreshold: 2500, earnMultiplier: 1.5, displayOrder: 2, benefits: { lounge: true,  priority: false, elite: false } },
    { name: 'Signature Elite', slug: 'signature-elite', pointsThreshold: 5000, earnMultiplier: 2.0, displayOrder: 3, benefits: { lounge: true,  priority: true,  elite: true  } },
  ]

  const existing = await prisma.membershipTier.findMany()
  if (existing.length === 0) {
    for (const t of tiers) {
      await prisma.membershipTier.create({ data: t })
      console.log(`  ✓ Tier created: ${t.name}`)
    }
  } else {
    console.log(`  ℹ Tiers already exist (${existing.length})`)
  }
  return prisma.membershipTier.findMany()
}

// ── 2. Create member accounts ─────────────────────────────────────────────────

const MEMBERS = [
  { email: 'dapo.adeleke@gmail.com',    password: 'Member2024!', name: 'Dapo Adeleke',    city: 'Lagos',  tier: 'signature-elite', walletKobo: 2500000, points: 6200 },
  { email: 'amaka.obi@gmail.com',       password: 'Member2024!', name: 'Amaka Obi',       city: 'Lagos',  tier: 'signature-plus',  walletKobo: 800000,  points: 3100 },
  { email: 'tunde.balogun@yahoo.com',   password: 'Member2024!', name: 'Tunde Balogun',   city: 'Abuja',  tier: 'signature',       walletKobo: 200000,  points: 850  },
  { email: 'chisom.nwosu@gmail.com',    password: 'Member2024!', name: 'Chisom Nwosu',    city: 'Lagos',  tier: 'signature-plus',  walletKobo: 1200000, points: 2900 },
  { email: 'ibrahim.musa@outlook.com',  password: 'Member2024!', name: 'Ibrahim Musa',    city: 'Abuja',  tier: 'signature',       walletKobo: 350000,  points: 420  },
]

async function createMembers(tiers) {
  const tierMap = Object.fromEntries(tiers.map(t => [t.slug, t]))
  const created = []

  for (const m of MEMBERS) {
    console.log(`\n  Processing: ${m.email}`)

    // Auth account
    let uid
    const { data, error } = await supabase.auth.admin.createUser({
      email: m.email, password: m.password, email_confirm: true,
    })

    if (error) {
      if (error.message?.includes('already') || error.message?.includes('registered')) {
        const { data: list } = await supabase.auth.admin.listUsers()
        const ex = list?.users?.find(u => u.email === m.email)
        if (!ex) { console.error(`  ✗ Could not find ${m.email}`); continue }
        uid = ex.id
        console.log(`  ℹ Auth exists — uid: ${uid}`)
      } else {
        console.error(`  ✗ Auth error: ${error.message}`); continue
      }
    } else {
      uid = data.user.id
      console.log(`  ✓ Auth created — uid: ${uid}`)
    }

    // User row
    const user = await prisma.user.upsert({
      where:  { id: uid },
      create: { id: uid, email: m.email, name: m.name, city: m.city, role: 'member', isActive: true },
      update: { email: m.email, name: m.name, role: 'member' },
    })
    console.log(`  ✓ User row upserted`)

    // Membership
    const tier = tierMap[m.tier]
    if (tier) {
      const existMembership = await prisma.userMembership.findUnique({ where: { userId: uid } })
      if (!existMembership) {
        await prisma.userMembership.create({
          data: { userId: uid, tierId: tier.id },
        })
        console.log(`  ✓ Membership: ${tier.name}`)
      } else {
        console.log(`  ℹ Membership already exists`)
      }
    }

    // Wallet
    const existWallet = await prisma.wallet.findUnique({ where: { userId: uid } })
    if (!existWallet) {
      await prisma.wallet.create({ data: { userId: uid } })
    }

    // Wallet transaction (balance)
    if (m.walletKobo > 0) {
      const existTxn = await prisma.walletTransaction.findFirst({ where: { userId: uid, type: 'LOAD' } })
      if (!existTxn) {
        await prisma.walletTransaction.create({
          data: { userId: uid, type: 'LOAD', amount: m.walletKobo, status: 'COMPLETED', description: 'Initial wallet credit' },
        })
        console.log(`  ✓ Wallet: ₦${(m.walletKobo / 100).toLocaleString()}`)
      }
    }

    // Points
    if (m.points > 0) {
      const existPts = await prisma.pointsLedger.findFirst({ where: { userId: uid } })
      if (!existPts) {
        await prisma.pointsLedger.create({
          data: { userId: uid, actionType: 'WELCOME_BONUS', points: m.points, balanceAfter: m.points },
        })
        console.log(`  ✓ Points: ${m.points}`)
      }
    }

    created.push({ uid, ...m })
  }

  return created
}

// ── 3. Create concierge & dining requests ─────────────────────────────────────

async function createRequests(members) {
  if (members.length === 0) {
    console.log('\n  ⚠ No members created — skipping requests')
    return
  }

  const restaurants = await prisma.restaurant.findMany({ take: 5 })
  const m0 = members[0], m1 = members[1] ?? members[0], m2 = members[2] ?? members[0]

  const conciergeData = [
    { userId: m0.uid, category: 'Transport', description: 'I need a private car to Murtala Muhammed International Airport on Friday 11 April at 05:30 AM. Flight is at 08:00. Luggage for 2 passengers.', status: 'RECEIVED', priority: 'URGENT' },
    { userId: m1.uid, category: 'Events', description: 'Looking for VIP tickets to the Davido concert at Eko Hotel on 20 April. Two tickets, VIP lounge section preferred.', status: 'IN_PROGRESS', priority: 'STANDARD' },
    { userId: m2.uid, category: 'Gifts', description: "Please source a luxury gift basket for my wife's birthday — Chanel or Tom Ford perfume, chocolate, flowers. Budget ₦150,000. Delivery to Lekki Phase 1 by 15 April.", status: 'AWAITING_UPDATE', priority: 'STANDARD' },
    { userId: m0.uid, category: 'Stay Support', description: 'The AC in Suite 304 at Eko Hotels is not working. Reported to front desk twice with no resolution. Please escalate urgently.', status: 'RECEIVED', priority: 'URGENT' },
    { userId: m1.uid, category: 'Recommendations', description: 'Looking for top spa recommendations in Victoria Island — full day package for two, couples massages preferred.', status: 'RECEIVED', priority: 'STANDARD' },
  ]

  for (const data of conciergeData) {
    // Check if already exists for this user
    const existing = await prisma.conciergeRequest.findFirst({ where: { userId: data.userId, category: data.category } })
    if (existing) { console.log(`  ℹ ConciergeRequest already exists for ${data.category}`); continue }

    const req = await prisma.conciergeRequest.create({ data })

    let thread = await prisma.chatThread.findUnique({ where: { userId: data.userId } })
    if (!thread) thread = await prisma.chatThread.create({ data: { userId: data.userId } })

    await prisma.chatMessage.create({
      data: { threadId: thread.id, userId: data.userId, senderRole: 'MEMBER', body: data.description, conciergeRequestId: req.id },
    })

    if (data.status === 'IN_PROGRESS' || data.status === 'AWAITING_UPDATE') {
      await prisma.chatMessage.create({
        data: { threadId: thread.id, userId: data.userId, senderRole: 'CONCIERGE', body: "Thank you for reaching out. We've received your request and our team is working on it. We'll have an update for you shortly.", conciergeRequestId: req.id },
      })
    }

    const m = members.find(x => x.uid === data.userId)
    console.log(`  ✓ ConciergeRequest: ${data.category} (${data.status}) for ${m?.name}`)
  }

  if (restaurants.length > 0) {
    const diningData = [
      { userId: m0.uid, restaurantId: restaurants[0].id, preferredDate: new Date('2026-04-12T19:00:00'), preferredTime: '7:00 PM', partySize: 4, occasion: 'Birthday', dietaryNotes: 'One guest is vegetarian', seatingPref: 'Window table', status: 'RECEIVED' },
      { userId: m1.uid, restaurantId: restaurants[Math.min(1, restaurants.length - 1)].id, preferredDate: new Date('2026-04-14T20:00:00'), preferredTime: '8:00 PM', partySize: 2, occasion: 'Anniversary', seatingPref: 'Private booth', status: 'IN_PROGRESS' },
    ]

    for (const data of diningData) {
      const existing = await prisma.diningRequest.findFirst({ where: { userId: data.userId, restaurantId: data.restaurantId } })
      if (existing) { console.log(`  ℹ DiningRequest already exists`); continue }

      const req = await prisma.diningRequest.create({ data })
      let thread = await prisma.chatThread.findUnique({ where: { userId: data.userId } })
      if (!thread) thread = await prisma.chatThread.create({ data: { userId: data.userId } })
      await prisma.chatMessage.create({
        data: { threadId: thread.id, userId: data.userId, senderRole: 'MEMBER', body: `Reservation for ${data.partySize} guests on ${data.preferredDate.toLocaleDateString('en-GB')} at ${data.preferredTime}${data.occasion ? '. Occasion: ' + data.occasion : ''}`, diningRequestId: req.id },
      })

      const m = members.find(x => x.uid === data.userId)
      console.log(`  ✓ DiningRequest for ${m?.name} at ${restaurants.find(r => r.id === data.restaurantId)?.name}`)
    }
  } else {
    console.log('  ℹ No restaurants — skipping dining requests')
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n═══════════════════════════════════════')
  console.log('  Nigerent Signature — Full Data Seed')
  console.log('═══════════════════════════════════════\n')

  console.log('── 1. Ensuring membership tiers ──')
  const tiers = await ensureTiers()

  console.log('\n── 2. Creating member accounts ──')
  const members = await createMembers(tiers)

  console.log('\n── 3. Creating requests ──')
  await createRequests(members)

  console.log('\n═══════════════════════════════════════')
  console.log('  Done!')
  console.log('\n  Member login credentials:')
  for (const m of MEMBERS) {
    console.log(`  • ${m.email}  /  ${m.password}  (${m.tier})`)
  }
  console.log('\n  Log in as kike.elizabeth@nigerent.com → /concierge')
  console.log('═══════════════════════════════════════\n')

  await prisma.$disconnect()
}

run().catch(e => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})

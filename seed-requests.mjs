/**
 * seed-requests.mjs
 * Seeds realistic concierge + dining requests linked to existing member accounts.
 * Run with: node seed-requests.mjs
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.xmrxgbhrlxsflauvzjde:I3G5OE4JQKMnvzih@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true',
    },
  },
})

async function run() {
  console.log('\n── Seeding concierge & dining requests ──\n')

  // ── 1. Find member users ──
  const members = await prisma.user.findMany({
    where: { role: 'member', isActive: true },
    include: { membership: { include: { tier: true } } },
    take: 10,
  })

  if (members.length === 0) {
    console.log('⚠  No member accounts found. Create some members first via the invite flow.')
    await prisma.$disconnect()
    return
  }

  console.log(`Found ${members.length} member(s): ${members.map(m => m.email).join(', ')}\n`)

  // ── 2. Find restaurants ──
  const restaurants = await prisma.restaurant.findMany({ take: 5 })
  if (restaurants.length === 0) {
    console.log('⚠  No restaurants found. Dining requests will be skipped.')
  }

  // Use first member for most requests, spread across others
  const m0 = members[0]
  const m1 = members[1] ?? members[0]
  const m2 = members[2] ?? members[0]

  // ── 3. Seed ConciergeRequests ──
  const conciergeData = [
    {
      userId:      m0.id,
      category:    'Transport',
      description: 'I need a private car to Murtala Muhammed International Airport on Friday 11 April at 05:30 AM. Flight is at 08:00. Please arrange a reliable driver — luggage for 2 passengers.',
      status:      'RECEIVED',
      priority:    'URGENT',
    },
    {
      userId:      m1.id,
      category:    'Events',
      description: 'Looking for VIP tickets to the Davido concert at Eko Hotel on 20 April. Two tickets please, preferably in the VIP lounge section.',
      status:      'IN_PROGRESS',
      priority:    'STANDARD',
    },
    {
      userId:      m2.id,
      category:    'Gifts',
      description: 'Please source a luxury gift basket for my wife\'s birthday — she likes perfumes (Chanel or Tom Ford), chocolate, and flowers. Budget ₦150,000. Delivery to Lekki Phase 1 by 15 April.',
      status:      'AWAITING_UPDATE',
      priority:    'STANDARD',
    },
    {
      userId:      m0.id,
      category:    'Stay Support',
      description: 'The air conditioning in Suite 304 at Eko Hotels is not working. I\'ve reported to the front desk twice and nothing has been done. Please escalate.',
      status:      'RECEIVED',
      priority:    'URGENT',
    },
    {
      userId:      m1.id,
      category:    'Recommendations',
      description: 'Looking for top spa recommendations in Victoria Island — something with a full day package for two. Preferably somewhere that does couples massages.',
      status:      'RECEIVED',
      priority:    'STANDARD',
    },
  ]

  let conciergeCount = 0
  for (const data of conciergeData) {
    const req = await prisma.conciergeRequest.create({ data })

    // Add initial member message
    let thread = await prisma.chatThread.findUnique({ where: { userId: data.userId } })
    if (!thread) {
      thread = await prisma.chatThread.create({ data: { userId: data.userId } })
    }
    await prisma.chatMessage.create({
      data: {
        threadId:          thread.id,
        userId:            data.userId,
        senderRole:        'MEMBER',
        body:              data.description,
        conciergeRequestId: req.id,
      },
    })

    // Add a concierge reply for in-progress items
    if (data.status === 'IN_PROGRESS' || data.status === 'AWAITING_UPDATE') {
      await prisma.chatMessage.create({
        data: {
          threadId:          thread.id,
          userId:            data.userId,
          senderRole:        'CONCIERGE',
          body:              'Thank you for reaching out. We\'ve received your request and our team is working on it. We\'ll have an update for you shortly.',
          conciergeRequestId: req.id,
        },
      })
    }

    conciergeCount++
    console.log(`  ✓ ConciergeRequest: ${data.category} (${data.status}) for ${members.find(m => m.id === data.userId)?.name}`)
  }

  // ── 4. Seed DiningRequests ──
  if (restaurants.length > 0) {
    const r0 = restaurants[0]
    const r1 = restaurants[1] ?? restaurants[0]

    const diningData = [
      {
        userId:        m0.id,
        restaurantId:  r0.id,
        preferredDate: new Date('2026-04-12T19:00:00'),
        preferredTime: '7:00 PM',
        partySize:     4,
        occasion:      'Birthday',
        dietaryNotes:  'One guest is vegetarian',
        seatingPref:   'Window table',
        status:        'RECEIVED',
      },
      {
        userId:        m1.id,
        restaurantId:  r1.id,
        preferredDate: new Date('2026-04-14T20:00:00'),
        preferredTime: '8:00 PM',
        partySize:     2,
        occasion:      'Anniversary',
        dietaryNotes:  '',
        seatingPref:   'Private booth',
        status:        'IN_PROGRESS',
      },
      {
        userId:        m2.id,
        restaurantId:  r0.id,
        preferredDate: new Date('2026-04-10T13:00:00'),
        preferredTime: '1:00 PM',
        partySize:     6,
        occasion:      'Business lunch',
        dietaryNotes:  'Two guests halal only',
        seatingPref:   '',
        status:        'CONFIRMED',
      },
    ]

    for (const data of diningData) {
      if (data.status === 'CONFIRMED') continue // don't show confirmed in portal (already done)

      const req = await prisma.diningRequest.create({ data })

      let thread = await prisma.chatThread.findUnique({ where: { userId: data.userId } })
      if (!thread) {
        thread = await prisma.chatThread.create({ data: { userId: data.userId } })
      }
      await prisma.chatMessage.create({
        data: {
          threadId:       thread.id,
          userId:         data.userId,
          senderRole:     'MEMBER',
          body:           `Reservation request for ${data.partySize} guests on ${data.preferredDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} at ${data.preferredTime}${data.occasion ? '. Occasion: ' + data.occasion : ''}${data.dietaryNotes ? '. Dietary notes: ' + data.dietaryNotes : ''}`,
          diningRequestId: req.id,
        },
      })

      console.log(`  ✓ DiningRequest: ${r0.name} (${data.status}) for ${members.find(m => m.id === data.userId)?.name}`)
    }
  } else {
    console.log('  ℹ Skipped dining requests — no restaurants in database')
  }

  console.log(`\n── Done — ${conciergeCount} concierge requests created ──\n`)
  console.log('Now log in as kike.elizabeth@nigerent.com → the concierge portal should show requests.\n')

  await prisma.$disconnect()
}

run().catch(e => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})

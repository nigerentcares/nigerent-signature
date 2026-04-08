/**
 * seed-partner-images.mjs
 * Updates all partners with category-matched Unsplash images.
 * Run with: node seed-partner-images.mjs
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.xmrxgbhrlxsflauvzjde:I3G5OE4JQKMnvzih@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true',
    },
  },
})

const CAT_IMAGES = {
  'Wellness & Spa': [
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?w=800&q=80&auto=format&fit=crop',
  ],
  'Restaurant': [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80&auto=format&fit=crop',
  ],
  'Arts & Culture': [
    'https://images.unsplash.com/photo-1536924940564-58f3e06d7f23?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1594122230689-45899d9e6f69?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80&auto=format&fit=crop',
  ],
  'Entertainment': [
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1485579149621-3123dd979885?w=800&q=80&auto=format&fit=crop',
  ],
  'Nature & Adventure': [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1468413253725-0d5181091126?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1530053969600-caed2596d242?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=800&q=80&auto=format&fit=crop',
  ],
  'Nightlife': [
    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1575444758702-4a6b9222c016?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80&auto=format&fit=crop',
  ],
  'Supermarket': [
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=800&q=80&auto=format&fit=crop',
  ],
  'Pharmacy': [
    'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1585435557343-3f0069cd1336?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&q=80&auto=format&fit=crop',
  ],
  'Hospital & Medical': [
    'https://images.unsplash.com/photo-1519494026894-2bc4c11c13b1?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&q=80&auto=format&fit=crop',
  ],
}

const FALLBACK = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80&auto=format&fit=crop'

async function main() {
  console.log('🖼️  Updating partner images…')

  const partners = await prisma.partner.findMany({
    select: { id: true, name: true, category: true },
    orderBy: { name: 'asc' },
  })

  let updated = 0

  for (let i = 0; i < partners.length; i++) {
    const p = partners[i]
    const pool = CAT_IMAGES[p.category] ?? [FALLBACK]
    const img = pool[i % pool.length]

    await prisma.partner.update({
      where: { id: p.id },
      data: { imageUrl: img },
    })

    console.log(`  ✅ ${p.name} (${p.category}) → image assigned`)
    updated++
  }

  // Also update offers that don't have imageUrl set
  const offers = await prisma.offer.findMany({
    where: { imageUrl: null },
    select: { id: true, title: true, partner: { select: { category: true } } },
  })

  let offerUpdated = 0
  for (let i = 0; i < offers.length; i++) {
    const o = offers[i]
    const pool = CAT_IMAGES[o.partner.category] ?? [FALLBACK]
    const img = pool[(i + 3) % pool.length]  // offset from partner images for variety

    await prisma.offer.update({
      where: { id: o.id },
      data: { imageUrl: img },
    })
    offerUpdated++
  }

  console.log(`\n🎉 Updated ${updated} partners and ${offerUpdated} offers with images.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

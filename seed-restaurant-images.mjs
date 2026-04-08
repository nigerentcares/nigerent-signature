/**
 * seed-restaurant-images.mjs
 * Updates all restaurants with high-quality, cuisine-matched Unsplash images.
 * Run with: node seed-restaurant-images.mjs
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.xmrxgbhrlxsflauvzjde:I3G5OE4JQKMnvzih@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true',
    },
  },
})

// Curated high-quality Unsplash images by cuisine/style
const CUISINE_IMAGES = {
  japanese: [
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80&auto=format&fit=crop',
  ],
  african: [
    'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80&auto=format&fit=crop',
  ],
  nigerian: [
    'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=800&q=80&auto=format&fit=crop',
  ],
  italian: [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1481931098730-318b6f776db0?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80&auto=format&fit=crop',
  ],
  seafood: [
    'https://images.unsplash.com/photo-1484659619207-9165d119dafe?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1615361200141-f45040f367be?w=800&q=80&auto=format&fit=crop',
  ],
  steakhouse: [
    'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1558030137-a56c1b004fa4?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80&auto=format&fit=crop',
  ],
  asian: [
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1562802378-063ec186a863?w=800&q=80&auto=format&fit=crop',
  ],
  continental: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80&auto=format&fit=crop',
  ],
  french: [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=800&q=80&auto=format&fit=crop',
  ],
  indian: [
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&q=80&auto=format&fit=crop',
  ],
  lebanese: [
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80&auto=format&fit=crop',
  ],
  thai: [
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&q=80&auto=format&fit=crop',
  ],
  chinese: [
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80&auto=format&fit=crop',
  ],
  mediterranean: [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80&auto=format&fit=crop',
  ],
  cocktail: [
    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&q=80&auto=format&fit=crop',
  ],
  grill: [
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80&auto=format&fit=crop',
  ],
  cafe: [
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80&auto=format&fit=crop',
  ],
  turkish: [
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80&auto=format&fit=crop',
  ],
  finedining: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80&auto=format&fit=crop',
  ],
}

const FALLBACK = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80&auto=format&fit=crop',
]

function getImageForRestaurant(cuisine, index) {
  const c = cuisine.toLowerCase()
  for (const [key, urls] of Object.entries(CUISINE_IMAGES)) {
    if (c.includes(key)) {
      return [urls[index % urls.length]]
    }
  }
  // Check for fine dining keywords
  if (c.includes('fine') || c.includes('modern') || c.includes('contemporary') || c.includes('fusion')) {
    return [CUISINE_IMAGES.finedining[index % CUISINE_IMAGES.finedining.length]]
  }
  return [FALLBACK[index % FALLBACK.length]]
}

async function main() {
  console.log('🖼️  Updating restaurant images…')

  const restaurants = await prisma.restaurant.findMany({
    select: { id: true, name: true, cuisine: true, imageUrls: true },
    orderBy: { name: 'asc' },
  })

  let updated = 0

  for (let i = 0; i < restaurants.length; i++) {
    const r = restaurants[i]
    const newImages = getImageForRestaurant(r.cuisine, i)

    await prisma.restaurant.update({
      where: { id: r.id },
      data: { imageUrls: newImages },
    })

    console.log(`  ✅ ${r.name} (${r.cuisine}) → image assigned`)
    updated++
  }

  console.log(`\n🎉 Updated ${updated} restaurants with images.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

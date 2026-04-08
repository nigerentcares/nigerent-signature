/**
 * seed-menu-items.mjs
 * Seeds real menu items & prices for all Lagos restaurants.
 *
 * Run with: node seed-menu-items.mjs
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.xmrxgbhrlxsflauvzjde:I3G5OE4JQKMnvzih@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true',
    },
  },
})

async function main() {
  console.log('🍽️  Seeding menu items…')

  // Load menu data
  const menuData = JSON.parse(readFileSync('./menu-data.json', 'utf-8'))

  // Get all restaurants from DB to map name → id
  const restaurants = await prisma.restaurant.findMany({ select: { id: true, name: true } })
  const nameToId = Object.fromEntries(restaurants.map(r => [r.name, r.id]))

  console.log(`Found ${restaurants.length} restaurants in DB:`, restaurants.map(r => r.name).join(', '))

  // Clear existing menu items first (idempotent re-run)
  const deleted = await prisma.menuItem.deleteMany({})
  console.log(`Cleared ${deleted.count} existing menu items.`)

  // Group items by restaurant
  let created = 0
  let skipped = 0

  for (const item of menuData) {
    const restaurantId = nameToId[item.restaurantName]
    if (!restaurantId) {
      console.warn(`⚠️  Restaurant not found: "${item.restaurantName}" — skipping ${item.name}`)
      skipped++
      continue
    }

    await prisma.menuItem.create({
      data: {
        restaurantId,
        category:     item.category,
        name:         item.name,
        description:  item.description,
        price:        item.price,
        displayOrder: item.displayOrder,
        isAvailable:  true,
      },
    })
    created++
  }

  console.log(`\n✅ Created ${created} menu items (skipped ${skipped})`)
  console.log('Done!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

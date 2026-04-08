/**
 * seed-all-menus-hours.mjs  (batch-insert version)
 * Seeds menu items (prices in Naira → stored as kobo) and opening hours
 * for all 48 Lagos restaurants from the 4 batch research files.
 *
 * Run with: node seed-all-menus-hours.mjs
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync }  from 'fs'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.xmrxgbhrlxsflauvzjde:I3G5OE4JQKMnvzih@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true',
    },
  },
})

const batch1 = JSON.parse(readFileSync('./menu-batch-1.json', 'utf-8'))
const batch2 = JSON.parse(readFileSync('./menu-batch-2.json', 'utf-8'))
const batch3 = JSON.parse(readFileSync('./menu-batch-3.json', 'utf-8'))
const batch4 = JSON.parse(readFileSync('./menu-batch-4.json', 'utf-8'))

const allData = [...batch1, ...batch2, ...batch3, ...batch4].map(r => ({
  ...r,
  restaurantName: r.restaurantName
    .replace('RSVP (Cocktail Bar)', 'RSVP')
    .replace('Hard Rock Cafe Lagos', 'Hardrock Cafe Lagos')
    .trim(),
}))

function normaliseHours(rawHours) {
  const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
  const result = {}
  for (const day of days) {
    const val = rawHours[day]
    if (!val || val === 'closed') {
      result[day] = 'closed'
    } else if (typeof val === 'object' && val.open && val.close) {
      result[day] = { open: val.open, close: val.close }
    } else if (typeof val === 'string') {
      const m = val.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/)
      if (m) result[day] = { open: m[1], close: m[2] }
      else result[day] = 'closed'
    } else {
      result[day] = 'closed'
    }
  }
  return result
}

async function main() {
  const restaurants = await prisma.restaurant.findMany({ select: { id: true, name: true } })
  const nameToId = Object.fromEntries(restaurants.map(r => [r.name, r.id]))

  console.log(`Found ${restaurants.length} DB restaurants, ${allData.length} batch entries`)

  // Clear all existing menu items
  await prisma.menuItem.deleteMany({})
  console.log('Cleared old menu items')

  // Build all menu rows in memory
  const allRows = []
  for (const entry of allData) {
    const id = nameToId[entry.restaurantName]
    if (!id) { console.warn(`SKIP (no DB match): "${entry.restaurantName}"`); continue }

    // Update opening hours
    if (entry.openingHours) {
      await prisma.restaurant.update({
        where: { id },
        data: { openingHours: normaliseHours(entry.openingHours) },
      })
    }

    // Collect menu rows
    if (Array.isArray(entry.menuItems)) {
      for (const item of entry.menuItems) {
        allRows.push({
          restaurantId: id,
          category:     item.category    || 'Mains',
          name:         item.name,
          description:  item.description || '',
          price:        Math.round((item.priceNaira ?? 0) * 100),
          displayOrder: item.displayOrder ?? 1,
          isAvailable:  true,
        })
      }
    }
  }

  console.log(`Hours updated. Inserting ${allRows.length} menu items in batches…`)

  // Batch insert 100 at a time
  const CHUNK = 100
  let inserted = 0
  for (let i = 0; i < allRows.length; i += CHUNK) {
    const chunk = allRows.slice(i, i + CHUNK)
    await prisma.menuItem.createMany({ data: chunk })
    inserted += chunk.length
    console.log(`  Inserted ${inserted}/${allRows.length}`)
  }

  console.log(`\n✅ Done — ${inserted} menu items inserted across ${allData.length} restaurants`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

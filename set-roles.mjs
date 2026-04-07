/**
 * set-roles.mjs
 * Sets correct roles on existing User records after the UserRole migration.
 * Run once: node set-roles.mjs
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ROLES = [
  // Concierge staff
  { email: 'kike.elizabeth@nigerent.com', role: 'concierge' },
  { email: 'joy.ali@nigerent.com',        role: 'concierge' },
  // Admin — update this to your actual admin email
  { email: 'oye@nigerent.test',           role: 'admin'     },
]

async function run() {
  for (const { email, role } of ROLES) {
    const result = await prisma.user.updateMany({
      where: { email },
      data:  { role },
    })
    if (result.count > 0) {
      console.log(`✓ ${email} → ${role}`)
    } else {
      console.log(`⚠ ${email} — not found in User table (skip)`)
    }
  }

  // Confirm final state
  console.log('\n── Current roles ──')
  const users = await prisma.user.findMany({
    select: { email: true, role: true },
    orderBy: { createdAt: 'asc' },
  })
  users.forEach(u => console.log(`  ${u.role.padEnd(12)} ${u.email}`))

  await prisma.$disconnect()
  console.log('\n── Done ──')
}

run().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1) })

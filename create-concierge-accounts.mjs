/**
 * create-concierge-accounts.mjs
 * Creates Supabase auth accounts + User + AdminUser rows for concierge staff.
 * Run with: node create-concierge-accounts.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { PrismaClient }  from '@prisma/client'

const SUPABASE_URL      = 'https://xmrxgbhrlxsflauvzjde.supabase.co'
const SERVICE_ROLE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtcnhnYmhybHhzZmxhdXZ6amRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTUyNTE4NCwiZXhwIjoyMDkxMTAxMTg0fQ.JwPXhzDwOUKSYCd1oqX0mrjzvu_yJ_cRkFPjbqbG30w'

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.xmrxgbhrlxsflauvzjde:I3G5OE4JQKMnvzih@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true',
    },
  },
})

const ACCOUNTS = [
  { email: 'kike.elizabeth@nigerent.com', password: 'Nigerent2024!', name: 'Kike Elizabeth' },
  { email: 'joy.ali@nigerent.com',        password: 'Nigerent2024!', name: 'Joy Ali'         },
]

async function run() {
  for (const account of ACCOUNTS) {
    console.log(`\n── Processing: ${account.email} ──`)

    // ── 1. Create (or fetch existing) Supabase auth user ──
    let authUid
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email:           account.email,
      password:        account.password,
      email_confirm:   true,   // skip email verification
    })

    if (createErr) {
      if (createErr.message?.toLowerCase().includes('already been registered') ||
          createErr.message?.toLowerCase().includes('already exists')) {
        // User already exists — look them up
        const { data: list } = await supabaseAdmin.auth.admin.listUsers()
        const existing = list?.users?.find(u => u.email === account.email)
        if (!existing) {
          console.error(`  ✗ Could not find existing user for ${account.email}:`, createErr.message)
          continue
        }
        authUid = existing.id
        console.log(`  ℹ Auth user already exists — uid: ${authUid}`)
      } else {
        console.error(`  ✗ Auth creation failed for ${account.email}:`, createErr.message)
        continue
      }
    } else {
      authUid = created.user.id
      console.log(`  ✓ Supabase auth user created — uid: ${authUid}`)
    }

    // ── 2. Upsert User record (uses Supabase UID as PK) ──
    try {
      await prisma.user.upsert({
        where:  { id: authUid },
        create: {
          id:       authUid,
          email:    account.email,
          name:     account.name,
          city:     'Lagos',
          isActive: true,
        },
        update: {
          email: account.email,
          name:  account.name,
        },
      })
      console.log(`  ✓ User record upserted (id: ${authUid})`)
    } catch (err) {
      // If unique constraint on email from a different id — report and continue
      console.error(`  ✗ User upsert failed:`, err.message)
    }

    // ── 3. Upsert AdminUser record with CONCIERGE_AGENT role ──
    try {
      const existing = await prisma.adminUser.findUnique({ where: { email: account.email } })
      if (existing) {
        await prisma.adminUser.update({
          where: { email: account.email },
          data:  { role: 'CONCIERGE_AGENT', isActive: true },
        })
        console.log(`  ✓ AdminUser updated — role: CONCIERGE_AGENT`)
      } else {
        await prisma.adminUser.create({
          data: {
            id:       authUid,
            email:    account.email,
            name:     account.name,
            role:     'CONCIERGE_AGENT',
            isActive: true,
          },
        })
        console.log(`  ✓ AdminUser created — role: CONCIERGE_AGENT`)
      }
    } catch (err) {
      console.error(`  ✗ AdminUser upsert failed:`, err.message)
    }
  }

  await prisma.$disconnect()
  console.log('\n── Done ──\n')
}

run().catch(e => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})

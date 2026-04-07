/**
 * /admin/offers — Offer & Partner Management
 * Server Component: fetches data, hands off interactivity to OffersClient.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import AdminShell from '@/components/admin/AdminShell'
import OffersClient from '@/components/admin/OffersClient'

async function getData() {
  const [offers, partners] = await Promise.all([
    prisma.offer.findMany({
      orderBy: { createdAt: 'desc' },
      include: { partner: true },
    }),
    prisma.partner.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
  ])
  return { offers, partners }
}

export default async function OffersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?reason=session_expired')

  const { offers, partners } = await getData()

  // Serialize dates → strings for client component
  const serializedOffers = offers.map(o => ({
    ...o,
    validFrom:  o.validFrom.toISOString(),
    validTo:    o.validTo?.toISOString() ?? null,
    createdAt:  o.createdAt.toISOString(),
    updatedAt:  o.updatedAt.toISOString(),
    partner:    { name: o.partner.name },
  }))

  return (
    <AdminShell activeNav="offers">
      <div className="adm-pg-hdr">
        <div>
          <div className="adm-pg-eye">Catalogue</div>
          <div className="adm-pg-title">Offers &amp; Partners</div>
        </div>
      </div>

      <OffersClient initialOffers={serializedOffers} initialPartners={partners} />
    </AdminShell>
  )
}

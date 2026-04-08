/**
 * /admin/partners — Partner Management
 */

import { redirect }     from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma }       from '@/lib/prisma'
import AdminShell       from '@/components/admin/AdminShell'
import PartnersClient   from '@/components/admin/PartnersClient'

async function getData() {
  const partners = await prisma.partner.findMany({
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    include: { _count: { select: { offers: true } } },
  })
  return partners.map(p => ({
    id:          p.id,
    name:        p.name,
    category:    p.category,
    city:        p.city,
    area:        p.area,
    description: p.description,
    imageUrl:    p.imageUrl,
    isActive:    p.isActive,
    offerCount:  p._count.offers,
    createdAt:   p.createdAt.toISOString(),
    contactInfo: p.contactInfo as Record<string, string> | null,
  }))
}

export default async function PartnersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?reason=session_expired')

  const partners = await getData()

  return (
    <AdminShell activeNav="partners">
      <div className="adm-pg-hdr">
        <div>
          <div className="adm-pg-eye">Directory</div>
          <div className="adm-pg-title">Partners</div>
        </div>
      </div>
      <PartnersClient partners={partners} />
    </AdminShell>
  )
}

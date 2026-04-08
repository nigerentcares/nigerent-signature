/**
 * /arts-culture — Curated Arts & Culture Experiences
 * Server Component: fetches active Arts & Culture offers; hands off to ArtsCultureClient.
 */

import { redirect }         from 'next/navigation'
import { createClient }     from '@/lib/supabase/server'
import { prisma }           from '@/lib/prisma'
import ArtsCultureClient    from '@/components/member/ArtsCultureClient'

async function getArtsCultureOffers() {
  return prisma.offer.findMany({
    where: {
      status:  'ACTIVE',
      partner: { category: 'Arts & Culture' },
    },
    include: { partner: true },
    orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }],
  })
}

export default async function ArtsCulturePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?reason=session_expired')

  const offers = await getArtsCultureOffers()

  const serialized = offers.map(o => ({
    id:              o.id,
    title:           o.title,
    shortDesc:       o.shortDesc,
    description:     o.description,
    category:        o.category,
    tierEligibility: o.tierEligibility,
    pointsEligible:  o.pointsEligible,
    pointsAward:     o.pointsAward,
    redemptionType:  o.redemptionType as 'SHOW_ON_SCREEN' | 'CODE' | 'CONCIERGE_CONFIRM',
    redemptionCode:  o.redemptionCode,
    redemptionSteps: Array.isArray(o.redemptionSteps) ? o.redemptionSteps as string[] : [],
    termsConditions: o.termsConditions,
    imageUrl:        o.imageUrl,
    validTo:         o.validTo?.toISOString() ?? null,
    isFeatured:      o.isFeatured,
    partner: {
      name:        o.partner.name,
      category:    o.partner.category,
      area:        o.partner.area,
      city:        o.partner.city,
      contactInfo: o.partner.contactInfo,
    },
  }))

  return <ArtsCultureClient offers={serialized} />
}

/**
 * /dining — Curated Dining
 * Server Component: fetches real restaurants; hands off interactivity to DiningClient.
 * Falls back to showcase UI when no restaurants are seeded yet.
 */

import { redirect }    from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma }       from '@/lib/prisma'
import DiningClient     from '@/components/member/DiningClient'


async function getRestaurants() {
  return prisma.restaurant.findMany({
    where:   { isActive: true },
    orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
  })
}

export default async function DiningPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?reason=session_expired')

  const restaurants = await getRestaurants()

  // Serialize dates for client
  const serialized = restaurants.map(r => ({
    id:           r.id,
    name:         r.name,
    cuisine:      r.cuisine,
    area:         r.area,
    city:         r.city,
    memberBenefit: r.memberBenefit,
    priceLevel:   r.priceLevel,
    ambianceTags: r.ambianceTags,
    imageUrls:    r.imageUrls,
    isFeatured:   r.isFeatured,
    isActive:     r.isActive,
  }))

  return <DiningClient restaurants={serialized} />
}

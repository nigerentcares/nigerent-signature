/**
 * /admin/restaurants — Restaurant Management
 * Server Component: fetches restaurant list, delegates interactivity to RestaurantsClient.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import AdminShell from '@/components/admin/AdminShell'
import RestaurantsClient from '@/components/admin/RestaurantsClient'

async function getRestaurants() {
  return prisma.restaurant.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { diningRequests: true } },
    },
  })
}

export default async function RestaurantsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?reason=session_expired')

  const restaurants = await getRestaurants()

  // Serialize for client
  const serialized = restaurants.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    openingHours: r.openingHours as Record<string, string>,
  }))

  return (
    <AdminShell activeNav="restaurants">
      <div className="adm-pg-hdr">
        <div>
          <div className="adm-pg-eye">Dining</div>
          <div className="adm-pg-title">Restaurants</div>
        </div>
      </div>

      <RestaurantsClient initialRestaurants={serialized} />
    </AdminShell>
  )
}

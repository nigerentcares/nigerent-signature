/**
 * /dining/[id] — Restaurant Detail Page
 *
 * Server Component: fetches restaurant + menu items from Prisma.
 * Shows: photo hero, description, hours, member benefit, menu, reserve CTA.
 */

import { redirect, notFound } from 'next/navigation'
import { createClient }        from '@/lib/supabase/server'
import { prisma }              from '@/lib/prisma'
import RestaurantDetailClient  from '@/components/member/RestaurantDetailClient'

async function getRestaurant(id: string) {
  return prisma.restaurant.findUnique({
    where:   { id, isActive: true },
    include: {
      menuItems: {
        where:   { isAvailable: true },
        orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }],
      },
    },
  })
}

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?reason=session_expired')

  const restaurant = await getRestaurant(id)
  if (!restaurant) notFound()

  // Serialize dates — openingHours is already JSON
  const serialized = {
    id:               restaurant.id,
    name:             restaurant.name,
    cuisine:          restaurant.cuisine,
    city:             restaurant.city,
    area:             restaurant.area,
    description:      restaurant.description,
    imageUrls:        restaurant.imageUrls,
    ambianceTags:     restaurant.ambianceTags,
    memberBenefit:    restaurant.memberBenefit,
    priceLevel:       restaurant.priceLevel,
    openingHours:     restaurant.openingHours as Record<string, { open: string; close: string } | 'closed'>,
    reservationNotes: restaurant.reservationNotes,
    mapLink:          restaurant.mapLink,
    isFeatured:       restaurant.isFeatured,
    menuItems:        restaurant.menuItems.map(m => ({
      id:          m.id,
      category:    m.category,
      name:        m.name,
      description: m.description,
      price:       m.price,
      imageUrl:    m.imageUrl,
    })),
  }

  return <RestaurantDetailClient restaurant={serialized} />
}

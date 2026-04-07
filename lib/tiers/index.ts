/**
 * Tier Engine — Nigerent Signature Lifestyle
 *
 * Checks whether a member qualifies for a tier upgrade based on their
 * lifetime earned points, and upgrades them automatically if they do.
 *
 * Tier thresholds (from seed):
 *   Signature      —   0 pts
 *   Signature Plus — 2,500 pts
 *   Elite          — 5,000 pts
 *
 * Manual overrides are respected — if `isManualOverride` is true on the
 * membership record, automatic upgrades are skipped.
 */

import { prisma } from '@/lib/prisma'

/**
 * Check if the user qualifies for a higher tier and upgrade them.
 * Returns the new tier name if upgraded, or null if no change.
 */
export async function checkAndUpgradeTier(userId: string): Promise<string | null> {
  const membership = await prisma.userMembership.findUnique({
    where: { userId },
    include: { tier: true },
  })

  if (!membership) return null

  // Skip automatic upgrades for manually overridden tiers
  if (membership.isManualOverride) return null

  // Calculate lifetime earned points (sum of all positive ledger entries)
  const result = await prisma.pointsLedger.aggregate({
    where: { userId, points: { gt: 0 } },
    _sum: { points: true },
  })
  const lifetimePoints = result._sum.points ?? 0

  // Find the highest tier they qualify for
  const allTiers = await prisma.membershipTier.findMany({
    orderBy: { pointsThreshold: 'desc' },
  })

  const qualifiedTier = allTiers.find(t => lifetimePoints >= t.pointsThreshold)

  if (!qualifiedTier) return null
  if (qualifiedTier.id === membership.tierId) return null // already on this tier

  // Only upgrade, never downgrade
  if (qualifiedTier.displayOrder <= membership.tier.displayOrder) return null

  // Upgrade!
  await prisma.userMembership.update({
    where: { userId },
    data: { tierId: qualifiedTier.id },
  })

  // Send a congratulations notification
  await prisma.notification.create({
    data: {
      userId,
      type:  'TIER_UPGRADE',
      title: `You've been upgraded to ${qualifiedTier.name}!`,
      body:  `Congratulations! Your lifetime points (${lifetimePoints.toLocaleString()}) have earned you ${qualifiedTier.name} status. Enjoy your new benefits.`,
      ctaUrl: '/rewards',
    },
  })

  return qualifiedTier.name
}

/**
 * Admin utility: manually set a user's tier (with override flag).
 */
export async function setTierManually(
  userId: string,
  tierSlug: string,
  adminId: string,
  reason?: string,
): Promise<void> {
  const tier = await prisma.membershipTier.findUnique({ where: { slug: tierSlug } })
  if (!tier) throw new Error(`Tier "${tierSlug}" not found`)

  await prisma.userMembership.update({
    where: { userId },
    data: {
      tierId: tier.id,
      isManualOverride: true,
      overrideReason: reason ?? `Manually set by admin`,
      overrideBy: adminId,
    },
  })
}

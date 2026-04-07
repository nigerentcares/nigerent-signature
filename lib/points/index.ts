/**
 * Points Engine — Nigerent Signature Lifestyle
 *
 * Central helper for awarding / deducting points and querying balances.
 * Every points mutation goes through `awardPoints` so the ledger stays
 * consistent and tier-upgrade checks happen automatically.
 *
 * ── Earning rules (tweak amounts here) ──────────────────────────────
 * WELCOME_BONUS      → 500 pts   (handled at signup, not here)
 * WALLET_LOAD        → 1 pt  per ₦100 loaded
 * DINING_CONFIRMED   → 150 pts   per confirmed reservation
 * OFFER_REDEMPTION   → offer.pointsAward (set per-offer in admin)
 * STAY_BOOKING       → 5 pts per ₦1,000 (future — stays not yet wired)
 * REFERRAL           → 300 pts   (future)
 * CAMPAIGN_BONUS     → variable  (manual via admin)
 * MANUAL_AWARD       → variable  (admin)
 * MANUAL_DEDUCT      → negative  (admin)
 */

import { prisma } from '@/lib/prisma'
import { checkAndUpgradeTier } from '@/lib/tiers'
import type { PointsAction } from '@prisma/client'

// ─── Configurable earn rates ─────────────────────────────────────────────────

export const EARN_RATES = {
  /** Points per ₦100 loaded into wallet */
  WALLET_LOAD_PER_100: 1,
  /** Flat points for a confirmed dining reservation */
  DINING_CONFIRMED: 150,
  /** Points per ₦1,000 on stay bookings (future) */
  STAY_PER_1000: 5,
  /** Flat points for a successful referral (future) */
  REFERRAL: 300,
} as const

// ─── Core: award points ──────────────────────────────────────────────────────

interface AwardOpts {
  userId: string
  actionType: PointsAction
  points: number            // positive = earn, negative = deduct
  referenceId?: string      // link to txn / offer / booking that triggered it
  campaignId?: string
  adminNote?: string
  createdBy?: string        // admin user id for manual awards
  skipTierCheck?: boolean   // skip automatic tier-upgrade (e.g. during signup)
}

/**
 * Award (or deduct) points for a user.
 *
 * 1. Fetches current balance from the most recent ledger entry.
 * 2. Creates a new PointsLedger row with updated `balanceAfter`.
 * 3. Fetches the user's tier earn-multiplier and applies it to positive awards.
 * 4. Optionally runs a tier-upgrade check.
 *
 * Returns the created ledger entry.
 */
export async function awardPoints(opts: AwardOpts) {
  const { userId, actionType, referenceId, campaignId, adminNote, createdBy, skipTierCheck } = opts
  let { points } = opts

  // Apply tier earn multiplier for positive awards (not manual or deductions)
  if (points > 0 && actionType !== 'MANUAL_AWARD' && actionType !== 'MANUAL_DEDUCT') {
    const membership = await prisma.userMembership.findUnique({
      where: { userId },
      include: { tier: true },
    })
    const multiplier = membership?.tier?.earnMultiplier ?? 1
    points = Math.round(points * multiplier)
  }

  // Get current balance
  const latest = await prisma.pointsLedger.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
  const currentBalance = latest?.balanceAfter ?? 0
  const balanceAfter = Math.max(0, currentBalance + points) // never go below 0

  const entry = await prisma.pointsLedger.create({
    data: {
      userId,
      actionType,
      points,
      balanceAfter,
      referenceId,
      campaignId,
      adminNote,
      createdBy,
    },
  })

  // Tier upgrade check (fire-and-forget — shouldn't block the response)
  if (!skipTierCheck && points > 0) {
    checkAndUpgradeTier(userId).catch(err =>
      console.error('[points] tier-check failed for', userId, err),
    )
  }

  return entry
}

// ─── Convenience: compute points for a wallet load ───────────────────────────

/** How many points a wallet load of `amountKobo` earns. */
export function walletLoadPoints(amountKobo: number): number {
  const naira = Math.floor(amountKobo / 100)
  return Math.floor(naira / 100) * EARN_RATES.WALLET_LOAD_PER_100
}

// ─── Query helpers ───────────────────────────────────────────────────────────

/** Total points balance for a user (from last ledger entry). */
export async function getBalance(userId: string): Promise<number> {
  const latest = await prisma.pointsLedger.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
  return latest?.balanceAfter ?? 0
}

/** Total lifetime points earned (sum of all positive entries). */
export async function getLifetimeEarned(userId: string): Promise<number> {
  const result = await prisma.pointsLedger.aggregate({
    where: { userId, points: { gt: 0 } },
    _sum: { points: true },
  })
  return result._sum.points ?? 0
}

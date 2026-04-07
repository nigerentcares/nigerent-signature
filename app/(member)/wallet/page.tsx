/**
 * /wallet — Member Wallet + Rewards (combined)
 *
 * Server Component: fetches wallet + points data, renders WalletRewardsClient
 * which provides a tab switcher between the two views.
 */

import { redirect }    from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma }       from '@/lib/prisma'
import WalletRewardsClient, { WalletData, RewardsData } from '@/components/member/WalletRewardsClient'

const TIERS = [
  { name: 'Signature',      slug: 'signature', min: 0,    max: 2499  },
  { name: 'Signature Plus', slug: 'plus',      min: 2500, max: 4999  },
  { name: 'Elite',          slug: 'elite',     min: 5000, max: 99999 },
]

async function getData(userId: string): Promise<{ wallet: WalletData; rewards: RewardsData }> {
  const [
    loads, spends, monthLoads, monthSpends,
    walletPtsAgg, transactions,
    pointsAgg, membership, history, expiringAgg,
  ] = await Promise.all([
    // Wallet
    prisma.walletTransaction.aggregate({
      where: { userId, status: 'COMPLETED', type: { in: ['LOAD','REFUND','ADJUSTMENT'] } },
      _sum: { amount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: { userId, status: 'COMPLETED', type: 'SPEND' },
      _sum: { amount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: {
        userId, status: 'COMPLETED', type: { in: ['LOAD','REFUND','ADJUSTMENT'] },
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      _sum: { amount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: {
        userId, status: 'COMPLETED', type: 'SPEND',
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      _sum: { amount: true },
    }),
    prisma.pointsLedger.aggregate({
      where: { userId, actionType: 'WALLET_LOAD' },
      _sum: { points: true },
    }),
    prisma.walletTransaction.findMany({
      where: { userId, status: { in: ['COMPLETED','PENDING'] } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    // Rewards
    prisma.pointsLedger.aggregate({
      where: { userId },
      _sum: { points: true },
    }),
    prisma.userMembership.findUnique({
      where: { userId },
      include: { tier: true },
    }),
    prisma.pointsLedger.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.pointsLedger.aggregate({
      where: {
        userId,
        expiresAt: { not: null, lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        points: { gt: 0 },
      },
      _sum: { points: true },
    }),
  ])

  const balance     = Math.floor(((loads._sum.amount ?? 0) - (spends._sum.amount ?? 0)) / 100)
  const monthLoaded = Math.floor((monthLoads._sum.amount ?? 0) / 100)
  const monthSpent  = Math.floor((monthSpends._sum.amount ?? 0) / 100)
  const walletPts   = walletPtsAgg._sum.points ?? 0
  const tierName    = membership?.tier.name ?? 'Signature'

  const totalPoints = pointsAgg._sum.points ?? 0
  const expiringPts = expiringAgg._sum.points ?? 0

  const currentIdx = (() => {
    const i = TIERS.findIndex(t => totalPoints >= t.min && totalPoints <= t.max)
    return i >= 0 ? i : 0
  })()
  const current   = TIERS[currentIdx]
  const next      = TIERS[currentIdx + 1] ?? null
  const ptsToNext = next ? next.min - totalPoints : 0
  const progress  = next
    ? Math.min(((totalPoints - current.min) / (next.min - current.min)) * 100, 100)
    : 100

  const wallet: WalletData = {
    balance, monthLoaded, monthSpent, walletPts, tierName,
    transactions: transactions.map(tx => ({
      id: tx.id, type: tx.type, description: tx.description ?? '',
      amount: tx.amount, status: tx.status,
      paymentMethod: tx.paymentMethod ?? null,
      createdAt: tx.createdAt.toISOString(),
    })),
  }

  const rewards: RewardsData = {
    totalPoints, expiringPts, tierName,
    tierSlug:     membership?.tier.slug ?? 'signature',
    currentIdx,
    progress,
    ptsToNext,
    nextTierName: next?.name ?? null,
    nextTierMin:  next?.min  ?? null,
    history: history.map(h => ({
      id: h.id, actionType: h.actionType, points: h.points,
      balanceAfter: h.balanceAfter,
      referenceId:  h.referenceId ?? null,
      adminNote:    h.adminNote ?? null,
      createdAt:    h.createdAt.toISOString(),
    })),
  }

  return { wallet, rewards }
}

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?reason=session_expired')

  const { wallet, rewards } = await getData(user.id)

  return <WalletRewardsClient wallet={wallet} rewards={rewards} />
}

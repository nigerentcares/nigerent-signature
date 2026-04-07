/**
 * /admin — Dashboard overview (Layer 9)
 * Server Component: live stats from Prisma + recent activity feed.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import AdminShell from '@/components/admin/AdminShell'

async function getDashboardData() {
  const [
    totalMembers,
    activeMembers,
    totalWalletTxns,
    walletVolumeAgg,
    openRequests,
    totalOffers,
    recentMembers,
    recentRequests,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.walletTransaction.count(),
    prisma.walletTransaction.aggregate({
      where: { type: 'LOAD' },
      _sum: { amount: true },
    }),
    prisma.conciergeRequest.count({ where: { status: 'RECEIVED' } }),
    prisma.offer.count({ where: { status: 'ACTIVE' } }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { membership: { include: { tier: true } } },
    }),
    prisma.conciergeRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: true },
    }),
  ])

  return {
    totalMembers,
    activeMembers,
    walletVolume: walletVolumeAgg._sum.amount ?? 0,
    openRequests,
    totalOffers,
    totalWalletTxns,
    recentMembers,
    recentRequests,
  }
}

function fmt(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}k`
  return `₦${n}`
}

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?reason=session_expired')

  const d = await getDashboardData()

  const stats = [
    { label: 'Total Members',    value: d.totalMembers.toString(),   sub: `${d.activeMembers} active`,            icon: '👥', color: 'var(--teal)' },
    { label: 'Wallet Volume',    value: fmt(d.walletVolume),          sub: `${d.totalWalletTxns} transactions`,    icon: '💳', color: 'var(--gold)' },
    { label: 'Open Requests',    value: d.openRequests.toString(),    sub: 'Received, not yet handled',            icon: '💬', color: '#f5a623'    },
    { label: 'Active Offers',    value: d.totalOffers.toString(),     sub: 'Live partner offers',                  icon: '✦',  color: 'var(--teal)' },
  ]

  return (
    <AdminShell activeNav="dashboard">
      {/* ── Header ── */}
      <div className="adm-pg-hdr">
        <div>
          <div className="adm-pg-eye">Overview</div>
          <div className="adm-pg-title">Dashboard</div>
        </div>
        <div className="adm-hdr-actions">
          <Link href="/admin/members" className="adm-btn-outline">+ Add Member</Link>
          <Link href="/admin/offers" className="adm-btn-primary">+ New Offer</Link>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="adm-stats-grid">
        {stats.map(s => (
          <div key={s.label} className="adm-stat">
            <div className="adm-stat-top">
              <div className="adm-stat-ico" style={{ color: s.color }}>{s.icon}</div>
              <div className="adm-stat-val">{s.value}</div>
            </div>
            <div className="adm-stat-lbl">{s.label}</div>
            <div className="adm-stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="adm-two-col">
        {/* ── Recent Members ── */}
        <div className="adm-card">
          <div className="adm-card-hdr">
            <div className="adm-card-title">Recent Members</div>
            <Link href="/admin/members" className="adm-card-link">See all →</Link>
          </div>
          <div className="adm-list">
            {d.recentMembers.length === 0 && (
              <div className="adm-empty">No members yet</div>
            )}
            {d.recentMembers.map(m => (
              <div key={m.id} className="adm-list-item">
                <div className="adm-avatar">{m.name.slice(0, 2).toUpperCase()}</div>
                <div className="adm-list-info">
                  <div className="adm-list-name">{m.name}</div>
                  <div className="adm-list-sub">{m.email}</div>
                </div>
                <div className="adm-tier-badge" style={{ background: m.membership?.tier.slug === 'signature-elite' ? 'rgba(200,168,75,.12)' : m.membership?.tier.slug === 'signature-plus' ? 'rgba(212,175,55,.1)' : 'rgba(31,163,166,.1)', color: m.membership?.tier.slug === 'signature-elite' ? 'var(--elite)' : m.membership?.tier.slug === 'signature-plus' ? 'var(--gold)' : 'var(--teal)' }}>
                  {m.membership?.tier.name ?? 'Signature'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Recent Concierge Requests ── */}
        <div className="adm-card">
          <div className="adm-card-hdr">
            <div className="adm-card-title">Concierge Requests</div>
            <Link href="/admin/concierge" className="adm-card-link">See all →</Link>
          </div>
          <div className="adm-list">
            {d.recentRequests.length === 0 && (
              <div className="adm-empty">No requests yet</div>
            )}
            {d.recentRequests.map(r => (
              <div key={r.id} className="adm-list-item">
                <div className="adm-req-ico">{r.category === 'DINING' ? '🍽️' : r.category === 'TRANSPORT' ? '🚗' : r.category === 'EVENTS' ? '🎟️' : r.category === 'GIFTS' ? '🎁' : '💬'}</div>
                <div className="adm-list-info">
                  <div className="adm-list-name">{r.user.name}</div>
                  <div className="adm-list-sub">{r.category} · {r.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                </div>
                <div className={`adm-status adm-st-${r.status.toLowerCase()}`}>{r.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="adm-card" style={{ marginTop: 20 }}>
        <div className="adm-card-hdr">
          <div className="adm-card-title">Quick Actions</div>
        </div>
        <div className="adm-quick-grid">
          <Link href="/admin/members" className="adm-quick">
            <div className="adm-quick-ico">👥</div>
            <div className="adm-quick-lbl">Manage Members</div>
            <div className="adm-quick-sub">View, search, assign tiers</div>
          </Link>
          <Link href="/admin/offers" className="adm-quick">
            <div className="adm-quick-ico">✦</div>
            <div className="adm-quick-lbl">Manage Offers</div>
            <div className="adm-quick-sub">Create &amp; publish partner offers</div>
          </Link>
          <Link href="/admin/concierge" className="adm-quick">
            <div className="adm-quick-ico">💬</div>
            <div className="adm-quick-lbl">Concierge Queue</div>
            <div className="adm-quick-sub">Handle open requests</div>
          </Link>
          <Link href="/admin/wallet" className="adm-quick">
            <div className="adm-quick-ico">💳</div>
            <div className="adm-quick-lbl">Wallet Ops</div>
            <div className="adm-quick-sub">Transactions &amp; adjustments</div>
          </Link>
        </div>
      </div>
    </AdminShell>
  )
}

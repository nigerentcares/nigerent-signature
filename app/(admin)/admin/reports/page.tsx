/**
 * /admin/reports — Analytics & Reporting
 * Server Component: aggregates live data into a dashboard of key metrics.
 */

import { redirect }     from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma }       from '@/lib/prisma'
import AdminShell       from '@/components/admin/AdminShell'

function fmt(n: number, prefix = '₦') {
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${prefix}${(n / 1_000).toFixed(0)}k`
  return `${prefix}${n.toLocaleString()}`
}

function pct(a: number, b: number) {
  if (b === 0) return '—'
  return `${Math.round((a / b) * 100)}%`
}

function monthLabel(d: Date) {
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

async function getReportData() {
  const now    = new Date()
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1)

  const [
    totalMembers,
    activeMembers,
    tierBreakdown,
    walletLoadAgg,
    walletSpendAgg,
    totalDiningRequests,
    confirmedDining,
    totalConcierge,
    resolvedConcierge,
    activeOffers,
    totalRedemptions,
    recentSignups,       // last 6 months
    monthlyLoads,        // last 6 months
    topOffers,
    topRestaurants,
    cityBreakdown,
    urgentConcierge,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'member' } }),
    prisma.user.count({ where: { role: 'member', isActive: true } }),

    prisma.userMembership.groupBy({
      by: ['tierId'],
      _count: { userId: true },
    }),

    prisma.walletTransaction.aggregate({
      where: { type: { in: ['LOAD', 'REFUND', 'ADJUSTMENT'] }, status: 'COMPLETED' },
      _sum: { amount: true }, _count: { id: true },
    }),

    prisma.walletTransaction.aggregate({
      where: { type: 'SPEND', status: 'COMPLETED' },
      _sum: { amount: true }, _count: { id: true },
    }),

    prisma.diningRequest.count(),
    prisma.diningRequest.count({ where: { status: 'CONFIRMED' } }),

    prisma.conciergeRequest.count(),
    prisma.conciergeRequest.count({ where: { status: 'COMPLETED' } }),

    prisma.offer.count({ where: { status: 'ACTIVE' } }),
    prisma.offerRedemption.count(),

    // Signups grouped by month (last 6 months)
    prisma.user.findMany({
      where: { role: 'member', createdAt: { gte: oneYearAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),

    // Wallet loads grouped by month (last 6 months)
    prisma.walletTransaction.findMany({
      where: { type: 'LOAD', status: 'COMPLETED', createdAt: { gte: oneYearAgo } },
      select: { createdAt: true, amount: true },
      orderBy: { createdAt: 'asc' },
    }),

    // Top 5 most redeemed offers
    prisma.offerRedemption.groupBy({
      by: ['offerId'], _count: { offerId: true },
      orderBy: { _count: { offerId: 'desc' } }, take: 5,
    }),

    // Top 5 restaurants by dining requests
    prisma.diningRequest.groupBy({
      by: ['restaurantId'], _count: { restaurantId: true },
      orderBy: { _count: { restaurantId: 'desc' } }, take: 5,
    }),

    prisma.user.groupBy({
      by: ['city'], where: { role: 'member' },
      _count: { city: true }, orderBy: { _count: { city: 'desc' } },
    }),

    prisma.conciergeRequest.count({ where: { priority: 'URGENT', status: { notIn: ['COMPLETED', 'CANCELLED'] } } }),
  ])

  // Resolve tier names
  const tiers = await prisma.membershipTier.findMany({ select: { id: true, name: true, slug: true } })
  const tierMap = Object.fromEntries(tiers.map(t => [t.id, t]))
  const tierRows = tierBreakdown.map(tb => ({
    name:  tierMap[tb.tierId]?.name ?? tb.tierId,
    slug:  tierMap[tb.tierId]?.slug ?? '',
    count: tb._count.userId,
  })).sort((a, b) => b.count - a.count)

  // Resolve top offer titles
  const topOfferIds = topOffers.map(o => o.offerId)
  const topOfferDetails = await prisma.offer.findMany({
    where: { id: { in: topOfferIds } },
    select: { id: true, title: true, partner: { select: { name: true } } },
  })
  const offerDetailMap = Object.fromEntries(topOfferDetails.map(o => [o.id, o]))
  const topOffersResolved = topOffers.map(o => ({
    title:  offerDetailMap[o.offerId]?.title ?? 'Unknown',
    partner: offerDetailMap[o.offerId]?.partner.name ?? '—',
    count:  o._count.offerId,
  }))

  // Resolve top restaurant names
  const topRestIds = topRestaurants.map(r => r.restaurantId)
  const topRestDetails = await prisma.restaurant.findMany({
    where: { id: { in: topRestIds } }, select: { id: true, name: true },
  })
  const restDetailMap = Object.fromEntries(topRestDetails.map(r => [r.id, r]))
  const topRestsResolved = topRestaurants.map(r => ({
    name:  restDetailMap[r.restaurantId]?.name ?? 'Unknown',
    count: r._count.restaurantId,
  }))

  // Build monthly buckets (last 6 months)
  const months: { label: string; key: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ label: monthLabel(d), key: `${d.getFullYear()}-${d.getMonth()}` })
  }

  const signupsByMonth: Record<string, number> = {}
  for (const u of recentSignups) {
    const key = `${u.createdAt.getFullYear()}-${u.createdAt.getMonth()}`
    signupsByMonth[key] = (signupsByMonth[key] ?? 0) + 1
  }

  const loadsByMonth: Record<string, number> = {}
  for (const t of monthlyLoads) {
    const key = `${t.createdAt.getFullYear()}-${t.createdAt.getMonth()}`
    loadsByMonth[key] = (loadsByMonth[key] ?? 0) + Math.round(t.amount / 100)
  }

  const monthlyData = months.map(m => ({
    label:    m.label,
    signups:  signupsByMonth[m.key] ?? 0,
    walletNgn: loadsByMonth[m.key] ?? 0,
  }))

  return {
    totalMembers, activeMembers,
    walletVolume: walletLoadAgg._sum.amount ?? 0,
    walletLoads:  walletLoadAgg._count.id,
    walletSpend:  walletSpendAgg._sum.amount ?? 0,
    totalDiningRequests, confirmedDining,
    totalConcierge, resolvedConcierge,
    activeOffers, totalRedemptions,
    tierRows, monthlyData, topOffersResolved, topRestsResolved,
    cityBreakdown, urgentConcierge,
  }
}

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?reason=session_expired')

  const d = await getReportData()

  const maxSignup = Math.max(...d.monthlyData.map(m => m.signups), 1)
  const maxWallet = Math.max(...d.monthlyData.map(m => m.walletNgn), 1)

  const bar = (value: number, max: number, color: string) => (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0, height: 60 }}>
      <div style={{ width: '100%', height: `${Math.max((value / max) * 100, 4)}%`, background: color, borderRadius: '4px 4px 0 0', minHeight: 3, transition: 'height .3s' }} />
    </div>
  )

  return (
    <AdminShell activeNav="reports">
      <div className="adm-pg-hdr">
        <div>
          <div className="adm-pg-eye">Business Intelligence</div>
          <div className="adm-pg-title">Reports &amp; Analytics</div>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(201,206,214,.35)', fontWeight: 600 }}>
          Live data · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* ── Key Metrics ── */}
      <div className="adm-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'Total Members',     value: d.totalMembers.toString(),                   sub: `${d.activeMembers} active`,                  icon: '👥', color: '#1fa3a6' },
          { label: 'Wallet Volume',     value: fmt(Math.floor(d.walletVolume / 100)),        sub: `${d.walletLoads} loads`,                     icon: '💳', color: '#d4af37' },
          { label: 'Offer Redemptions', value: d.totalRedemptions.toString(),                sub: `${d.activeOffers} active offers`,             icon: '✦',  color: '#9b59b6' },
          { label: 'Urgent Requests',   value: d.urgentConcierge.toString(),                 sub: 'Open urgent concierge',                       icon: '🚨', color: '#e74c3c' },
        ].map(s => (
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
        {/* ── Monthly Signups ── */}
        <div className="adm-card">
          <div className="adm-card-hdr">
            <div className="adm-card-title">Member Signups (6 months)</div>
            <div style={{ fontSize: 11, color: 'rgba(201,206,214,.35)' }}>
              Total {d.monthlyData.reduce((s, m) => s + m.signups, 0)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 8, paddingBottom: 4 }}>
            {d.monthlyData.map(m => (
              <div key={m.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                {bar(m.signups, maxSignup, '#1fa3a6')}
                <div style={{ fontSize: 9, color: 'rgba(201,206,214,.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.label.split(' ')[0]}</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(201,206,214,.8)' }}>{m.signups}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Monthly Wallet Volume ── */}
        <div className="adm-card">
          <div className="adm-card-hdr">
            <div className="adm-card-title">Wallet Loads (6 months)</div>
            <div style={{ fontSize: 11, color: 'rgba(201,206,214,.35)' }}>
              Total {fmt(d.monthlyData.reduce((s, m) => s + m.walletNgn, 0))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 8, paddingBottom: 4 }}>
            {d.monthlyData.map(m => (
              <div key={m.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                {bar(m.walletNgn, maxWallet, '#d4af37')}
                <div style={{ fontSize: 9, color: 'rgba(201,206,214,.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.label.split(' ')[0]}</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(201,206,214,.8)' }}>{fmt(m.walletNgn)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="adm-two-col">
        {/* ── Tier Distribution ── */}
        <div className="adm-card">
          <div className="adm-card-hdr">
            <div className="adm-card-title">Tier Distribution</div>
          </div>
          {d.tierRows.length === 0
            ? <div className="adm-empty">No membership data</div>
            : d.tierRows.map(t => {
                const pct2 = d.totalMembers > 0 ? Math.round((t.count / d.totalMembers) * 100) : 0
                const color = t.slug === 'elite' ? '#c8a84b' : t.slug === 'plus' ? '#d4af37' : '#1fa3a6'
                return (
                  <div key={t.name} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                      <span style={{ fontWeight: 700, color: 'rgba(201,206,214,.8)' }}>{t.name}</span>
                      <span style={{ color: 'rgba(201,206,214,.45)' }}>{t.count} · {pct2}%</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct2}%`, background: color, borderRadius: 3 }} />
                    </div>
                  </div>
                )
              })
          }
        </div>

        {/* ── City Distribution ── */}
        <div className="adm-card">
          <div className="adm-card-hdr">
            <div className="adm-card-title">Members by City</div>
          </div>
          {d.cityBreakdown.length === 0
            ? <div className="adm-empty">No data</div>
            : d.cityBreakdown.map(c => {
                const pct2 = d.totalMembers > 0 ? Math.round((c._count.city / d.totalMembers) * 100) : 0
                return (
                  <div key={c.city} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                      <span style={{ fontWeight: 700, color: 'rgba(201,206,214,.8)' }}>{c.city ?? 'Unknown'}</span>
                      <span style={{ color: 'rgba(201,206,214,.45)' }}>{c._count.city} · {pct2}%</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct2}%`, background: '#1fa3a6', borderRadius: 3 }} />
                    </div>
                  </div>
                )
              })
          }
        </div>
      </div>

      <div className="adm-two-col">
        {/* ── Top Offers ── */}
        <div className="adm-card">
          <div className="adm-card-hdr">
            <div className="adm-card-title">Top Redeemed Offers</div>
            <div style={{ fontSize: 11, color: 'rgba(201,206,214,.35)' }}>{d.totalRedemptions} total</div>
          </div>
          {d.topOffersResolved.length === 0
            ? <div className="adm-empty">No redemptions yet</div>
            : d.topOffersResolved.map((o, i) => (
                <div key={o.title} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < d.topOffersResolved.length - 1 ? '1px solid rgba(201,206,214,.05)' : 'none' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(155,89,182,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#9b59b6', flexShrink: 0 }}>#{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(201,206,214,.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.title}</div>
                    <div style={{ fontSize: 11, color: 'rgba(201,206,214,.4)' }}>{o.partner}</div>
                  </div>
                  <span style={{ background: 'rgba(155,89,182,.1)', color: '#9b59b6', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{o.count}×</span>
                </div>
              ))
          }
        </div>

        {/* ── Top Restaurants & Concierge Stats ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="adm-card">
            <div className="adm-card-hdr">
              <div className="adm-card-title">Top Dining Venues</div>
              <div style={{ fontSize: 11, color: 'rgba(201,206,214,.35)' }}>{d.totalDiningRequests} requests · {pct(d.confirmedDining, d.totalDiningRequests)} confirmed</div>
            </div>
            {d.topRestsResolved.length === 0
              ? <div className="adm-empty">No dining requests yet</div>
              : d.topRestsResolved.map((r, i) => (
                  <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < d.topRestsResolved.length - 1 ? '1px solid rgba(201,206,214,.05)' : 'none' }}>
                    <div style={{ fontSize: 14 }}>🍽️</div>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'rgba(201,206,214,.8)' }}>{r.name}</div>
                    <span style={{ background: 'rgba(31,163,166,.1)', color: '#1fa3a6', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 800 }}>{r.count}</span>
                  </div>
                ))
            }
          </div>

          <div className="adm-card">
            <div className="adm-card-hdr">
              <div className="adm-card-title">Concierge Overview</div>
            </div>
            {[
              { label: 'Total Requests',  value: d.totalConcierge.toString() },
              { label: 'Resolved',        value: `${d.resolvedConcierge} (${pct(d.resolvedConcierge, d.totalConcierge)})` },
              { label: 'Open Urgent',     value: d.urgentConcierge.toString(), warn: d.urgentConcierge > 0 },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(201,206,214,.05)' }}>
                <span style={{ fontSize: 12, color: 'rgba(201,206,214,.5)' }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: row.warn ? '#e74c3c' : 'rgba(201,206,214,.85)' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Wallet Summary ── */}
      <div className="adm-card" style={{ marginTop: 20 }}>
        <div className="adm-card-hdr">
          <div className="adm-card-title">Wallet Summary</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { label: 'Total Loaded',  value: fmt(Math.floor(d.walletVolume / 100)),  sub: `${d.walletLoads} transactions`,   color: '#1ea86a' },
            { label: 'Total Spent',   value: fmt(Math.floor(d.walletSpend / 100)),   sub: `${d.walletSpendAgg ?? ''} spend transactions`, color: '#e74c3c' },
            { label: 'Net Balance',   value: fmt(Math.floor((d.walletVolume - d.walletSpend) / 100)), sub: 'Across all members', color: '#1fa3a6' },
          ].map(w => (
            <div key={w.label} style={{ padding: '16px', background: 'rgba(255,255,255,.03)', borderRadius: 12, border: '1px solid rgba(201,206,214,.07)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(201,206,214,.3)', marginBottom: 6 }}>{w.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: w.color, marginBottom: 4 }}>{w.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(201,206,214,.35)' }}>{w.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  )
}

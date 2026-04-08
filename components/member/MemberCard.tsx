'use client'

/**
 * MemberCard — The loyalty card shown at the top of the Home dashboard.
 * Shows tier badge, greeting, member name, and three stat columns:
 * Points · Wallet balance · Saved offers.
 */

import Link from 'next/link'

interface MemberCardProps {
  name:         string
  memberNumber: string
  tierName:     string
  points:       number
  walletBalance: number
  savedCount:   number
  city:         string
  unreadCount:  number
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatPoints(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  return n.toLocaleString()
}

function formatWallet(ngn: number): string {
  if (ngn >= 1_000_000) return `₦${(ngn / 1_000_000).toFixed(1)}m`
  if (ngn >= 1000)      return `₦${Math.round(ngn / 1000)}k`
  return `₦${ngn.toLocaleString()}`
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}

export default function MemberCard({
  name,
  memberNumber,
  tierName,
  points,
  walletBalance,
  savedCount,
  city,
  unreadCount,
}: MemberCardProps) {
  const greeting = getGreeting()
  const today    = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day:     'numeric',
    month:   'short',
  })

  return (
    <div className="hdr" style={{ paddingBottom: 28 }}>
      {/* ── Brand Row ── */}
      <div className="brand-row">
        <div>
          <div className="brand-name">Signature Lifestyle</div>
          <div className="brand-by">by Nigerent</div>
        </div>
        <div className="hdr-r">
          {/* Notification button */}
          <Link href="/notifications" style={{ textDecoration: 'none' }}>
            <div className="nb2">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  stroke="rgba(201,206,214,.5)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {unreadCount > 0 && <div className="npip" />}
            </div>
          </Link>
          {/* Avatar → tapping goes to Profile */}
          <Link href="/profile" style={{ textDecoration: 'none' }}>
            <div className="av">{getInitials(name)}</div>
          </Link>
        </div>
      </div>

      {/* ── Location / Date meta ── */}
      <div className="h-meta">
        <div className="h-loc">
          <div className="h-locdot" />
          {city}, Nigeria
        </div>
        <div className="h-tod">{today}</div>
      </div>

      {/* ── Loyalty Card ── */}
      <div className="mc-wrap" style={{ padding: '0 0' }}>
        <div className="lc">
          <div className="lo1" />
          <div className="lo2x" />
          <div className="ll" />
          <div className="lin">
            {/* ── Row 1: Brand mark left · Member ID right ── */}
            <div className="mc-top">
              <div className="mc-uba-text">NSL</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', color: 'rgba(201,206,214,.45)', textTransform: 'uppercase' }}>Member ID</div>
                <div className="mc-cardno" style={{ fontSize: 13, letterSpacing: '0.08em' }}>{memberNumber}</div>
              </div>
            </div>

            {/* ── Row 2: Name left · Tier badge right ── */}
            <div className="mc-mid">
              <div>
                <div className="mc-gr">{greeting}</div>
                <div className="mc-name">{name}</div>
                <div className="mc-sub">Signature Lifestyle by Nigerent</div>
              </div>
              <div className="tbadge">
                <span style={{ color: 'var(--gold)', fontSize: 11 }}>✦</span>
                <span className="tbadge-lbl">{tierName}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="mc-dv" />

            {/* Stats row */}
            <div className="mc-stats">
              <div className="mcs">
                <div className="mcs-l">Points</div>
                <div className="mcs-v">{formatPoints(points)}</div>
                <div className="mcs-s">Balance</div>
              </div>
              <div className="mcs">
                <div className="mcs-l">Wallet</div>
                <div className="mcs-v">{formatWallet(walletBalance)}</div>
                <div className="mcs-s">Available</div>
              </div>
              <div className="mcs">
                <div className="mcs-l">Saved</div>
                <div className="mcs-v">{savedCount}</div>
                <div className="mcs-s">Offers</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

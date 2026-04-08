'use client'

/**
 * MemberCard — The loyalty card shown at the top of the Home dashboard.
 * Front: tier badge, greeting, name, stats (points / wallet / saved).
 * Back:  card number, VALID THRU, CVV, cardholder name — tapping flips.
 */

import { useState } from 'react'
import Link         from 'next/link'

interface MemberCardProps {
  name:          string
  memberNumber:  string
  tierName:      string
  points:        number
  walletBalance: number
  savedCount:    number
  city:          string
  unreadCount:   number
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

/** Generate a deterministic 3-digit CVV from the member number */
function getCVV(memberNumber: string): string {
  let h = 0
  for (const c of memberNumber) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return String(100 + (h % 900))
}

/** Format member number into groups of 4 for the card face */
function formatCardNumber(memberNumber: string): string {
  // Extract digits only, pad/truncate to 16, then group
  const digits = memberNumber.replace(/\D/g, '').padEnd(16, '0').slice(0, 16)
  return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)} ${digits.slice(12, 16)}`
}

/** Derive a VALID THRU date: 5 years from a hash of the member number */
function getExpiry(memberNumber: string): string {
  let h = 0
  for (const c of memberNumber) h = (h * 17 + c.charCodeAt(0)) & 0xff
  const month = String(1 + (h % 12)).padStart(2, '0')
  const year  = String((new Date().getFullYear() + 4 + (h % 3)) % 100).padStart(2, '0')
  return `${month}/${year}`
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
  const [flipped, setFlipped] = useState(false)

  const greeting    = getGreeting()
  const today       = new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
  const cardNumber  = formatCardNumber(memberNumber)
  const expiry      = getExpiry(memberNumber)
  const cvv         = getCVV(memberNumber)

  return (
    <div className="hdr" style={{ paddingBottom: 28 }}>

      {/* ── Brand Row ── */}
      <div className="brand-row">
        <div>
          <div className="brand-name">Signature Lifestyle</div>
          <div className="brand-by">by Nigerent</div>
        </div>
        <div className="hdr-r">
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

      {/* ── Loyalty Card (flippable) ── */}
      <div className="mc-wrap">
        <div
          className={`lc-scene${flipped ? ' lc-flipped' : ''}`}
          onClick={() => setFlipped(f => !f)}
          role="button"
          aria-label="Tap to flip card"
        >
          <div className="lc-flipper">

            {/* ─── FRONT FACE ─── */}
            <div className="lc lc-front">
              <div className="lo1" />
              <div className="lo2x" />
              <div className="ll" />
              <div className="lin">

                {/* Row 1: UBA logo left · Member ID right */}
                <div className="mc-top">
                  <div className="mc-uba-text">UBA</div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                    <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.12em', color: 'rgba(201,206,214,.4)', textTransform: 'uppercase' }}>Member ID</div>
                    <div className="mc-cardno">{memberNumber}</div>
                  </div>
                </div>

                {/* Row 2: Name/greeting left · Tier badge right */}
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

                {/* Stats */}
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

                {/* Flip hint */}
                <div className="mc-flip-hint">Tap to view card details</div>
              </div>
            </div>

            {/* ─── BACK FACE ─── */}
            <div className="lc lc-back">
              <div className="lo1" />
              <div className="lo2x" />
              <div className="ll" />

              {/* Magnetic stripe */}
              <div className="mc-stripe" />

              <div className="lin" style={{ paddingTop: 12 }}>

                {/* Signature / CVV strip */}
                <div className="mc-sig-row">
                  <div className="mc-sig-strip">
                    <div className="mc-sig-lines">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="mc-sig-line" style={{ opacity: 0.06 + i * 0.01 }} />
                      ))}
                    </div>
                    <div className="mc-cvv-box">
                      <div className="mc-cvv-lbl">CVV</div>
                      <div className="mc-cvv-val">{cvv}</div>
                    </div>
                  </div>
                </div>

                {/* Card number */}
                <div className="mc-back-number">{cardNumber}</div>

                {/* Expiry + UBA */}
                <div className="mc-back-meta">
                  <div>
                    <div className="mc-back-lbl">VALID THRU</div>
                    <div className="mc-back-val">{expiry}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mc-back-lbl">ISSUED BY</div>
                    <div className="mc-uba-text mc-uba-sm">UBA</div>
                  </div>
                </div>

                {/* Cardholder */}
                <div className="mc-back-name">{name.toUpperCase()}</div>

                {/* Flip hint */}
                <div className="mc-flip-hint">Tap to flip back</div>
              </div>
            </div>

          </div>{/* lc-flipper */}
        </div>{/* lc-scene */}
      </div>

    </div>
  )
}

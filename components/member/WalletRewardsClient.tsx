'use client'
/**
 * WalletRewardsClient — tab-switched Wallet + Rewards view.
 * Receives all data server-side; tab state is client-only.
 */

import { useState } from 'react'
import Link from 'next/link'
import LoadWalletSheet from './LoadWalletSheet'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface WalletTx {
  id: string; type: string; description: string; amount: number
  status: string; paymentMethod: string | null; createdAt: string
}

export interface PointsEntry {
  id: string; actionType: string; points: number
  balanceAfter: number; referenceId: string | null
  adminNote: string | null; createdAt: string
}

export interface WalletData {
  balance:     number
  monthLoaded: number
  monthSpent:  number
  walletPts:   number
  tierName:    string
  transactions: WalletTx[]
}

export interface RewardsData {
  totalPoints: number
  expiringPts: number
  tierName:    string
  tierSlug:    string
  currentIdx:  number
  progress:    number   // 0-100
  ptsToNext:   number
  nextTierName: string | null
  nextTierMin:  number | null
  history:     PointsEntry[]
}

// ─── Static data ───────────────────────────────────────────────────────────────

const TIERS = [
  { name: 'Signature',      slug: 'signature', min: 0,    max: 2499,  perks: ['Partner offers', 'Concierge chat', 'Dining requests', '1× earn rate'] },
  { name: 'Signature Plus', slug: 'plus',      min: 2500, max: 4999,  perks: ['All Signature perks', '1.5× multiplier', 'Priority concierge', 'Exclusive offers'] },
  { name: 'Elite',          slug: 'elite',     min: 5000, max: 99999, perks: ['All Plus perks', '2× earn multiplier', 'Birthday perks', 'Dedicated concierge', 'Member events'] },
]

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatNGN(n: number): string {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}m`
  if (n >= 1_000)     return `₦${Math.round(n / 1_000)}k`
  return `₦${n.toLocaleString()}`
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
}
function formatMonth(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}
function formatPts(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  return n.toLocaleString()
}

function actionIcon(a: string) {
  const m: Record<string, string> = {
    STAY_BOOKING: '🏠', WALLET_LOAD: '💳', OFFER_REDEMPTION: '✦',
    DINING_CONFIRMED: '🍽️', REFERRAL: '👥', CAMPAIGN_BONUS: '🎁',
    WELCOME_BONUS: '✦', MANUAL_AWARD: '✦', MANUAL_DEDUCT: '✦',
  }
  return m[a] ?? '✦'
}
function actionLabel(a: string) {
  const m: Record<string, string> = {
    STAY_BOOKING: 'Stay Booking', WALLET_LOAD: 'Wallet Load Bonus',
    OFFER_REDEMPTION: 'Offer Redemption', DINING_CONFIRMED: 'Dining Confirmed',
    REFERRAL: 'Referral Bonus', CAMPAIGN_BONUS: 'Campaign Bonus',
    WELCOME_BONUS: 'Welcome Bonus', MANUAL_AWARD: 'Points Award',
    MANUAL_DEDUCT: 'Points Adjustment',
  }
  return m[a] ?? 'Points'
}
function ptsClass(a: string, pts: number) {
  if (pts < 0) return 'hi-pts red'
  if (['CAMPAIGN_BONUS','WELCOME_BONUS','MANUAL_AWARD'].includes(a)) return 'hi-pts bon'
  return 'hi-pts earn'
}
function icoClass(a: string) {
  if (['CAMPAIGN_BONUS','WELCOME_BONUS','MANUAL_AWARD'].includes(a)) return 'hi-ico bon'
  if (a === 'OFFER_REDEMPTION') return 'hi-ico red'
  return 'hi-ico earn'
}

// ─── Wallet tab ────────────────────────────────────────────────────────────────

function WalletTab({ d }: { d: WalletData }) {
  // Group transactions by month
  const grouped: Record<string, WalletTx[]> = {}
  for (const tx of d.transactions) {
    const key = formatMonth(tx.createdAt)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(tx)
  }

  return (
    <>
      {/* Balance Card */}
      <div className="wc-wrap">
        <div className="lc" style={{ background: 'linear-gradient(130deg,#0a1a1a 0%,#122424 35%,#0c1e1e 65%,#071212 100%)' }}>
          <div className="lo1" /><div className="lo2x" /><div className="ll" />
          <div className="lin">
            <div className="wc-top">
              <div className="tbadge">
                <span style={{ color: 'var(--gold)', fontSize: 11 }}>✦</span>
                <span className="tbadge-lbl">{d.tierName}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="rgba(201,206,214,.3)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span className="wc-sec-lbl">256-bit secured</span>
              </div>
            </div>
            <div className="wc-bl">Available Balance</div>
            <div className="wc-bal">
              <span className="wc-cur">₦</span>{d.balance.toLocaleString()}
            </div>
            {d.monthLoaded > 0 && (
              <div className="wc-up">↑ {formatNGN(d.monthLoaded)} loaded this month</div>
            )}
            <div className="wc-dv" />
            <div className="wc-sts">
              <div className="wcs2">
                <div className="wcs2-l">Spent</div>
                <div className="wcs2-v">{formatNGN(d.monthSpent)}</div>
                <div className="wcs2-s">this month</div>
              </div>
              <div className="wcs2">
                <div className="wcs2-l">Loaded</div>
                <div className="wcs2-v">{formatNGN(d.monthLoaded)}</div>
                <div className="wcs2-s">this month</div>
              </div>
              {d.walletPts > 0 && (
                <div className="wcs2">
                  <div className="wcs2-l">Pts earned</div>
                  <div className="wcs2-v">{d.walletPts}</div>
                  <div className="wcs2-s">reward pts</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-acts">
        <LoadWalletSheet />
        <Link href="#transactions" className="wa wa-g" style={{ textDecoration: 'none' }}>
          <div className="wa-ico wa-ico-t">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="#1fa3a6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="wa-lbl-d">Transactions</div>
          <div className="wa-sub-d">View history</div>
        </Link>
        <Link href="/explore" className="wa wa-g" style={{ textDecoration: 'none' }}>
          <div className="wa-ico wa-ico-t">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="#1fa3a6" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="wa-lbl-d">Explore</div>
          <div className="wa-sub-d">Member perks</div>
        </Link>
      </div>

      {/* Transaction History */}
      <div id="transactions" className="txn-hdr">
        <div className="txn-ttl">Transaction History</div>
      </div>
      <div className="txn-list">
        {Object.keys(grouped).length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted)', fontSize: 13 }}>
            No transactions yet. Load your wallet to get started.
          </div>
        )}
        {Object.entries(grouped).map(([month, txs]) => (
          <div key={month}>
            <div className="txn-mo">{month}</div>
            {txs.map((tx, i) => {
              const isCredit = ['LOAD','REFUND','ADJUSTMENT'].includes(tx.type)
              const amountNGN = Math.floor(tx.amount / 100)
              const isFirst = i === 0; const isLast = i === txs.length - 1
              const rClass = isFirst && isLast ? 'txi r0 rn' : isFirst ? 'txi r0' : isLast ? 'txi rm rn' : 'txi rm'
              const icon = tx.type === 'LOAD' ? '💳' : tx.type === 'SPEND' ? '🍽️' : tx.type === 'REFUND' ? '↩️' : '✦'
              return (
                <div key={tx.id} className={rClass}>
                  <div className={isCredit ? 'tx-ico ld' : 'tx-ico sp'}>{icon}</div>
                  <div className="tx-info">
                    <div className="tx-nm">{tx.description}</div>
                    <div className="tx-mt">{formatDate(tx.createdAt)}{tx.paymentMethod ? ` · ${tx.paymentMethod}` : ''}</div>
                  </div>
                  <div className="tx-r">
                    <div className={`tx-amt ${isCredit ? 'tx-cr' : 'tx-db'}`}>
                      {isCredit ? '+' : '−'}₦{amountNGN.toLocaleString()}
                    </div>
                    <div className="tx-st tx-ok">
                      {tx.status === 'COMPLETED' ? 'Completed' : tx.status === 'PENDING' ? 'Pending' : tx.status}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Support Strip */}
      <Link href="/chat" className="w-supp" style={{ textDecoration: 'none' }}>
        <div className="ws-ico">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="ws-tx">
          <div className="ws-n">Wallet support available</div>
          <div className="ws-s">Issues with a transaction? One tap away.</div>
        </div>
        <div className="ws-cta">Chat →</div>
      </Link>
    </>
  )
}

// ─── Rewards tab ───────────────────────────────────────────────────────────────

function RewardsTab({ d }: { d: RewardsData }) {
  const idx      = d.currentIdx >= 0 ? d.currentIdx : 0
  const current  = TIERS[idx]
  const next     = TIERS[idx + 1] ?? null

  // Group history by month
  const grouped: Record<string, PointsEntry[]> = {}
  for (const h of d.history) {
    const key = formatMonth(h.createdAt)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(h)
  }

  return (
    <>
      {/* Points Card */}
      <div className="pc-wrap">
        <div className="lc" style={{ background: 'linear-gradient(130deg,#0a1a1a 0%,#122424 35%,#0c1e1e 65%,#071212 100%)' }}>
          <div className="lo1" /><div className="lo2x" /><div className="ll" />
          <div className="lin">
            <div className="pc-top">
              <div className="tbadge">
                <span style={{ color: 'var(--gold)', fontSize: 11 }}>✦</span>
                <span className="tbadge-lbl">{d.tierName}</span>
              </div>
              <div className="pc-num">Points Balance</div>
            </div>
            <div className="pc-bal-lbl">Total Points</div>
            <div className="pc-bal">{d.totalPoints.toLocaleString()}</div>
            <div className="pc-change">↑ Earned across all activities</div>
            {next && (
              <>
                <div className="pc-prog-row">
                  <span className="pc-prog-lbl">{current?.name}</span>
                  <span className="pc-prog-next">{next.name} at {next.min.toLocaleString()} →</span>
                </div>
                <div className="pc-track">
                  <div className="pc-fill" style={{ width: `${d.progress}%` }} />
                </div>
                <div className="pc-prog-sub">
                  <b>{d.ptsToNext.toLocaleString()} pts</b> until {next.name}
                </div>
              </>
            )}
            {!next && (
              <div className="pc-prog-sub" style={{ marginTop: 12 }}>
                <b>Top tier achieved!</b> You&apos;re an Elite member ✦
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expiry Banner */}
      {d.expiringPts > 0 && (
        <div className="expiry">
          <div className="exp-ico">⏳</div>
          <div className="exp-tx">
            <div className="exp-title">Points expiring soon</div>
            <div className="exp-sub">{d.expiringPts.toLocaleString()} promo pts expire within 30 days</div>
          </div>
          <div className="exp-pts">{d.expiringPts.toLocaleString()} pts</div>
        </div>
      )}

      {/* Membership Tiers */}
      <div className="tiers-wrap">
        <div className="sh">
          <div className="sh-t">Membership Tiers</div>
        </div>
        <div className="tiers-row">
          {TIERS.map((tier, i) => {
            const isCurrent = i === idx
            const isLocked  = i > idx
            const variant   = i === 0 ? 'sig' : i === 1 ? 'plus' : 'elite'
            const dotClass  = i === 0 ? 't' : i === 1 ? 'g' : 'e'
            return (
              <div key={tier.slug} className={`tc ${variant}`}>
                <div className={`tc-orb ${dotClass}`} />
                <div className="tc-in">
                  {isCurrent && <div className="tc-badge cur">✦ Your Tier</div>}
                  {isLocked && <div className="tc-badge lk">🔒 {(tier.min - d.totalPoints).toLocaleString()} pts away</div>}
                  {!isCurrent && !isLocked && <div className="tc-spacer" />}
                  <div className={`tc-name${i === 2 ? ' en' : ''}`}>{tier.name}</div>
                  <div className="tc-range">
                    {i === 2 ? `${tier.min.toLocaleString()}+ pts` : `${tier.min.toLocaleString()} – ${tier.max.toLocaleString()} pts`}
                  </div>
                  <div className="tc-perks">
                    {tier.perks.map(perk => (
                      <div key={perk} className="tc-perk">
                        <div className={`tc-dot ${dotClass}`} />
                        <div className="tc-perk-txt">{perk}</div>
                      </div>
                    ))}
                  </div>
                  {isLocked && (
                    <div className="tc-lock">
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                        <rect x="3" y="11" width="18" height="11" rx="2" stroke="rgba(201,206,214,.25)" strokeWidth="1.5"/>
                        <path d="M7 11V7a5 5 0 0110 0v4" stroke="rgba(201,206,214,.25)" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <span className="tc-lock-txt">{(tier.min - d.totalPoints).toLocaleString()} pts to unlock</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Redeem CTA */}
      <Link href="/explore" className="redeem-card" style={{ textDecoration: 'none', display: 'block' }}>
        <div className="rc-orb" />
        <div className="rc-in">
          <div className="rc-eye">Redeem Points</div>
          <div className="rc-title">Use your points on<br/>partner offers &amp; perks</div>
          <div className="rc-sub">Points apply at offer checkout — no cash conversion</div>
          <div className="rc-pts-row">
            <div className="rc-pts-big">{d.totalPoints.toLocaleString()}</div>
            <div className="rc-pts-lbl">points<br/>available</div>
          </div>
          <div className="rc-btn">
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke="white" strokeWidth="1.8" fill="none"/>
            </svg>
            Browse Redeemable Offers
          </div>
        </div>
      </Link>

      {/* How to Earn */}
      <div className="earn-wrap">
        <div className="sh"><div className="sh-t">How to Earn Points</div></div>
        <div className="earn-grid">
          {[
            { ico: '🏠', pts: '5 pts / ₦1,000', lbl: 'Nigerent Stay',    sub: 'Earn on every booking' },
            { ico: '💳', pts: '1 pt / ₦100',    lbl: 'Wallet Load',      sub: 'Points on every top-up' },
            { ico: '✦',  pts: 'Flat bonus',      lbl: 'Offer Redemption', sub: 'Earn on qualifying offers' },
            { ico: '🍽️', pts: '150 pts',         lbl: 'Dining Confirmed', sub: 'Per confirmed reservation' },
            { ico: '👥', pts: '300 pts',         lbl: 'Referral',         sub: 'When a friend joins via your link' },
            { ico: '🎁', pts: 'Varies',          lbl: 'Campaigns',        sub: 'Bonus pts during promos' },
          ].map(e => (
            <div key={e.lbl} className="ec">
              <div className="ec-ico">{e.ico}</div>
              <div className="ec-pts">{e.pts}</div>
              <div className="ec-lbl">{e.lbl}</div>
              <div className="ec-sub">{e.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Points History */}
      <div className="hist-wrap">
        <div className="sh"><div className="sh-t">Points History</div></div>
        <div className="hist-list">
          {Object.keys(grouped).length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted)', fontSize: 13 }}>
              No points history yet. Start earning to see your activity here.
            </div>
          )}
          {Object.entries(grouped).map(([month, entries]) => (
            <div key={month}>
              <div className="hi-mo">{month}</div>
              {entries.map((entry, i) => {
                const isFirst = i === 0; const isLast = i === entries.length - 1
                const rClass = isFirst && isLast ? 'hi r0 rn' : isFirst ? 'hi r0' : isLast ? 'hi rm rn' : 'hi rm'
                return (
                  <div key={entry.id} className={rClass}>
                    <div className={icoClass(entry.actionType)}>{actionIcon(entry.actionType)}</div>
                    <div className="hi-inf">
                      <div className="hi-name">{actionLabel(entry.actionType)}</div>
                      <div className="hi-meta">
                        {formatDate(entry.createdAt)}
                        {entry.adminNote ? ` · ${entry.adminNote}` : ''}
                      </div>
                    </div>
                    <div className="hi-r">
                      <div className={ptsClass(entry.actionType, entry.points)}>
                        {entry.points > 0 ? '+' : '−'}{Math.abs(entry.points).toLocaleString()}
                      </div>
                      <div className="hi-bal">Bal: {formatPts(entry.balanceAfter)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ─── Root export ───────────────────────────────────────────────────────────────

export default function WalletRewardsClient({ wallet, rewards }: { wallet: WalletData; rewards: RewardsData }) {
  const [tab, setTab] = useState<'wallet' | 'rewards'>('wallet')

  return (
    <>
      {/* Header */}
      <div className="hdr" style={{ paddingBottom: 0 }}>
        <div className="pe">{tab === 'wallet' ? 'Member Wallet' : 'Points & Rewards'}</div>
        <div className="pt">{tab === 'wallet' ? 'Your Balance' : <><span className="pti">Earn</span> &amp; Redeem</>}</div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 0, padding: '14px 20px 0', background: 'var(--dark)' }}>
        {(['wallet', 'rewards'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '11px 0', border: 'none', cursor: 'pointer',
              fontFamily: 'Urbanist, sans-serif', fontSize: 13, fontWeight: 800,
              background: 'transparent',
              color: tab === t ? 'var(--teal)' : 'rgba(201,206,214,.35)',
              borderBottom: tab === t ? '2px solid var(--teal)' : '2px solid transparent',
              transition: 'all .15s', textTransform: 'capitalize',
            }}
          >
            {t === 'wallet' ? '💳 Wallet' : '✦ Rewards'}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'wallet' ? <WalletTab d={wallet} /> : <RewardsTab d={rewards} />}

      <div style={{ height: 36 }} />
    </>
  )
}

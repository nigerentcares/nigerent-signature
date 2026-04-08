'use client'
/**
 * RewardsConfigClient — edit tier thresholds, earn rates, and benefits.
 */

import { useState, FormEvent } from 'react'

interface Tier {
  id:              string
  name:            string
  slug:            string
  pointsThreshold: number
  earnMultiplier:  number
  benefits:        Record<string, unknown>
  memberCount:     number
  displayOrder:    number
}

const TIER_COLORS: Record<string, string> = {
  signature: '#1fa3a6',
  plus:      '#d4af37',
  elite:     '#c8a84b',
}

const EARN_RATES = [
  { label: '1× (Standard)',    value: 1.0 },
  { label: '1.25×',           value: 1.25 },
  { label: '1.5× (Plus)',     value: 1.5 },
  { label: '1.75×',           value: 1.75 },
  { label: '2× (Elite)',      value: 2.0 },
  { label: '2.5×',            value: 2.5 },
  { label: '3× (Premium)',    value: 3.0 },
]

const POINTS_ACTIONS = [
  { label: 'Wallet Load',       key: 'wallet_load',       default: '1 pt / ₦100' },
  { label: 'Dining Confirmed',  key: 'dining_confirmed',   default: '150 pts flat' },
  { label: 'Stay Booking',      key: 'stay_booking',       default: '5 pts / ₦1,000' },
  { label: 'Offer Redemption',  key: 'offer_redemption',   default: 'Configurable per offer' },
  { label: 'Referral',         key: 'referral',            default: '300 pts flat' },
  { label: 'Welcome Bonus',    key: 'welcome_bonus',       default: '500 pts on signup' },
]

export default function RewardsConfigClient({ tiers: initial }: { tiers: Tier[] }) {
  const [tiers,   setTiers]   = useState<Tier[]>(initial)
  const [editing, setEditing] = useState<Tier | null>(null)
  const [threshold, setThreshold] = useState('')
  const [multiplier, setMultiplier] = useState('')
  const [busyId,  setBusyId]  = useState<string | null>(null)
  const [saved,   setSaved]   = useState<string | null>(null)
  const [err,     setErr]     = useState('')

  function openEdit(t: Tier) {
    setEditing(t)
    setThreshold(t.pointsThreshold.toString())
    setMultiplier(t.earnMultiplier.toString())
    setErr('')
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!editing) return
    setErr(''); setBusyId(editing.id)

    const pts = parseInt(threshold, 10)
    const mul = parseFloat(multiplier)
    if (isNaN(pts) || pts < 0) { setErr('Threshold must be a non-negative number.'); setBusyId(null); return }
    if (isNaN(mul) || mul < 0.1 || mul > 10) { setErr('Earn rate must be between 0.1 and 10.'); setBusyId(null); return }

    try {
      const res = await fetch(`/api/admin/rewards/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pointsThreshold: pts, earnMultiplier: mul }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Failed.'); return }

      setTiers(ts => ts.map(t => t.id === editing.id ? { ...t, pointsThreshold: pts, earnMultiplier: mul } : t))
      setSaved(editing.id)
      setTimeout(() => { setEditing(null); setSaved(null) }, 900)
    } catch { setErr('Network error.') }
    finally { setBusyId(null) }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
    background: 'rgba(255,255,255,.05)', border: '1px solid rgba(201,206,214,.15)',
    color: '#fff', fontFamily: 'Urbanist, sans-serif', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <>
      {/* ── Tier Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 32 }}>
        {tiers.map(t => {
          const color = TIER_COLORS[t.slug] ?? '#1fa3a6'
          const isEditing = editing?.id === t.id
          const wasSaved  = saved === t.id

          return (
            <div key={t.id} className="adm-card" style={{ border: isEditing ? `1px solid ${color}40` : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color, marginBottom: 4 }}>
                    {t.slug === 'signature' ? 'Base Tier' : t.slug === 'plus' ? 'Mid Tier' : 'Top Tier'}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{t.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color }}>{t.memberCount}</div>
                  <div style={{ fontSize: 10, color: 'rgba(201,206,214,.4)', fontWeight: 600 }}>members</div>
                </div>
              </div>

              {!isEditing ? (
                <>
                  <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: 'rgba(201,206,214,.45)', fontWeight: 600 }}>Points Threshold</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>
                        {t.displayOrder === 0 ? 'Starting tier' : `${t.pointsThreshold.toLocaleString()} pts`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'rgba(201,206,214,.45)', fontWeight: 600 }}>Earn Multiplier</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color }}>{t.earnMultiplier}×</span>
                    </div>
                  </div>
                  <button onClick={() => openEdit(t)} className="adm-btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
                    Edit Tier
                  </button>
                </>
              ) : (
                <form onSubmit={handleSave}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(201,206,214,.4)', marginBottom: 4, display: 'block' }}>
                      Points Threshold
                    </label>
                    <input
                      type="number" min="0" value={threshold}
                      onChange={e => setThreshold(e.target.value)}
                      disabled={t.displayOrder === 0}
                      style={{ ...inp, opacity: t.displayOrder === 0 ? 0.4 : 1 }}
                      placeholder="e.g. 2500"
                    />
                    {t.displayOrder === 0 && <div style={{ fontSize: 10, color: 'rgba(201,206,214,.3)', marginTop: 3 }}>Base tier — always 0</div>}
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(201,206,214,.4)', marginBottom: 4, display: 'block' }}>
                      Earn Multiplier
                    </label>
                    <select value={multiplier} onChange={e => setMultiplier(e.target.value)} style={{ ...inp, appearance: 'none' }}>
                      {EARN_RATES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      <option value={multiplier}>{multiplier}× (custom)</option>
                    </select>
                  </div>
                  {err && <div style={{ padding: '6px 10px', background: 'rgba(255,80,80,.08)', border: '1px solid rgba(255,80,80,.2)', borderRadius: 8, fontSize: 11, color: 'rgba(255,110,110,.9)', marginBottom: 10 }}>{err}</div>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => setEditing(null)} style={{ flex: 1, padding: '9px', borderRadius: 8, background: 'rgba(201,206,214,.06)', border: '1px solid rgba(201,206,214,.1)', color: 'rgba(201,206,214,.5)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Urbanist,sans-serif' }}>Cancel</button>
                    <button type="submit" disabled={busyId === t.id} style={{ flex: 2, padding: '9px', borderRadius: 8, background: wasSaved ? '#1ea86a' : color, border: 'none', color: '#fff', fontSize: 12, fontWeight: 800, cursor: busyId === t.id ? 'not-allowed' : 'pointer', fontFamily: 'Urbanist,sans-serif', opacity: busyId === t.id ? 0.7 : 1 }}>
                      {busyId === t.id ? 'Saving…' : wasSaved ? '✓ Saved' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )
        })}
      </div>

      {/* ── How Points Are Earned (read-only reference) ── */}
      <div className="adm-card">
        <div className="adm-card-hdr">
          <div className="adm-card-title">Points Earn Rules</div>
          <div style={{ fontSize: 11, color: 'rgba(201,206,214,.35)' }}>Hard-coded in the points engine · edit in lib/points/index.ts</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginTop: 4 }}>
          {POINTS_ACTIONS.map(a => (
            <div key={a.key} style={{ padding: '12px 14px', background: 'rgba(255,255,255,.03)', borderRadius: 10, border: '1px solid rgba(201,206,214,.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(201,206,214,.8)', marginBottom: 4 }}>{a.label}</div>
              <div style={{ fontSize: 11, color: 'rgba(201,206,214,.4)' }}>{a.default}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(212,175,55,.05)', border: '1px solid rgba(212,175,55,.1)', borderRadius: 10 }}>
          <div style={{ fontSize: 11, color: 'rgba(212,175,55,.7)', lineHeight: 1.6 }}>
            💡 The earn multiplier above is applied to <strong>Wallet Load</strong> and <strong>Stay Booking</strong> base rates. For example, a 2× Elite member earns 2 pts per ₦100 loaded instead of 1. Tier upgrades run automatically when a member's total points cross the threshold.
          </div>
        </div>
      </div>
    </>
  )
}

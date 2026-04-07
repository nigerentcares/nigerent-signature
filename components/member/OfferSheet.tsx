'use client'
/**
 * OfferSheet — full offer detail + redemption flow.
 *
 * SHOW_ON_SCREEN → "Show to staff" full-screen overlay
 * CODE           → copy redemption code
 * CONCIERGE_CONFIRM → sends concierge request
 */

import { useState } from 'react'

interface Offer {
  id:             string
  title:          string
  shortDesc:      string
  description:    string
  category:       string
  tierEligibility: string[]
  pointsEligible: boolean
  pointsAward:    number | null
  redemptionType: 'SHOW_ON_SCREEN' | 'CODE' | 'CONCIERGE_CONFIRM'
  redemptionCode: string | null
  redemptionSteps: string[]
  termsConditions?: string | null
  imageUrl?:      string | null
  validTo?:       string | null
  partner: { name: string }
}

interface Props {
  offer:   Offer
  onClose: () => void
}

const CAT_ICONS: Record<string, string> = {
  DINING: '🍽️', WELLNESS: '🧖', NIGHTLIFE: '🥂', EVENTS: '🌇',
  TRANSPORT: '🚗', SHOPPING: '🛍️', STAYS: '🏠', SERVICES: '✂️',
}

type RedeemStep = 'detail' | 'redeeming' | 'show' | 'code' | 'concierge' | 'error'

export default function OfferSheet({ offer, onClose }: Props) {
  const [step, setStep]           = useState<RedeemStep>('detail')
  const [codeCopied, setCodeCopied] = useState(false)
  const [showTimer, setShowTimer] = useState(30)
  const [timerRunning, setTimerRunning] = useState(false)
  const [errMsg, setErrMsg]       = useState('')
  const [pointsEarned, setPointsEarned] = useState(0)

  async function handleRedeem() {
    setStep('redeeming')
    try {
      const res = await fetch('/api/offers/redeem', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ offerId: offer.id }),
      })
      const data = await res.json()

      if (!res.ok) {
        setErrMsg(data.error ?? 'Could not redeem this offer.')
        setStep('error')
        return
      }

      setPointsEarned(data.pointsAwarded ?? 0)

      if (data.type === 'CONCIERGE_CONFIRM') {
        setStep('concierge')
      } else if (data.type === 'CODE') {
        setStep('code')
      } else {
        // SHOW_ON_SCREEN — start 30-second timer
        setShowTimer(30)
        setTimerRunning(true)
        setStep('show')
        const t = setInterval(() => {
          setShowTimer(s => {
            if (s <= 1) { clearInterval(t); setTimerRunning(false); return 0 }
            return s - 1
          })
        }, 1000)
      }
    } catch {
      setErrMsg('Network error. Please try again.')
      setStep('error')
    }
  }

  function copyCode() {
    if (!offer.redemptionCode) return
    navigator.clipboard.writeText(offer.redemptionCode).then(() => {
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    })
  }

  const icon = CAT_ICONS[offer.category] ?? '✦'

  /* ─────────────── SHOW-ON-SCREEN overlay ─────────────── */
  if (step === 'show') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 28px' }}>
        {/* Timer ring */}
        <div style={{ position: 'absolute', top: 24, right: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid rgba(31,163,166,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: timerRunning ? 'var(--teal)' : 'rgba(201,206,214,.3)' }}>
            {showTimer}
          </div>
        </div>
        <button onClick={onClose} style={{ position: 'absolute', top: 24, left: 24, background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 10, width: 40, height: 40, cursor: 'pointer', color: 'rgba(201,206,214,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>×</button>

        <div style={{ fontSize: 64, marginBottom: 24 }}>{icon}</div>

        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 12 }}>
          {offer.partner.name}
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 600, color: 'var(--cream)', textAlign: 'center', marginBottom: 8, lineHeight: 1.3 }}>
          {offer.title}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(201,206,214,.55)', textAlign: 'center', lineHeight: 1.6, maxWidth: 300, marginBottom: 36 }}>
          {offer.shortDesc}
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(201,206,214,.1)', borderRadius: 20, padding: '20px 24px', width: '100%', maxWidth: 340, textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(201,206,214,.4)', marginBottom: 10 }}>
            SHOW THIS TO STAFF
          </div>
          <div style={{ fontSize: 42, marginBottom: 10 }}>✦</div>
          <div style={{ fontSize: 11, color: 'rgba(201,206,214,.3)' }}>
            Nigerent Signature · {offer.tierEligibility.join(' / ')}
          </div>
        </div>

        {/* Redemption steps */}
        {offer.redemptionSteps.length > 0 && (
          <div style={{ width: '100%', maxWidth: 340 }}>
            {offer.redemptionSteps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(31,163,166,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'var(--teal)', flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(201,206,214,.55)', paddingTop: 3 }}>{s}</div>
              </div>
            ))}
          </div>
        )}

        {pointsEarned > 0 && (
          <div style={{ marginTop: 20, background: 'rgba(212,175,55,.08)', border: '1px solid rgba(212,175,55,.2)', borderRadius: 12, padding: '10px 18px', fontSize: 12, fontWeight: 700, color: 'var(--gold)' }}>
            +{pointsEarned} points earned!
          </div>
        )}
      </div>
    )
  }

  /* ─────────────── CODE overlay ─────────────── */
  if (step === 'code') {
    return (
      <div className="ov2" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        <div className="sheet" style={{ textAlign: 'center' }}>
          <div className="s-hdr" style={{ justifyContent: 'flex-end' }}>
            <button className="s-cls" onClick={onClose}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" stroke="#4a5568" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          </div>

          <div style={{ fontSize: 40, marginBottom: 16 }}>{icon}</div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 6 }}>{offer.partner.name}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--dark)', marginBottom: 24 }}>{offer.title}</div>

          <div style={{ background: '#f7f5f2', border: '2px dashed rgba(31,163,166,.3)', borderRadius: 16, padding: '24px', marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>Your Redemption Code</div>
            <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 800, color: 'var(--dark)', letterSpacing: '4px', marginBottom: 16 }}>
              {offer.redemptionCode}
            </div>
            <button
              onClick={copyCode}
              style={{ padding: '9px 20px', borderRadius: 10, background: codeCopied ? 'rgba(30,168,106,.1)' : 'rgba(31,163,166,.1)', border: `1px solid ${codeCopied ? 'rgba(30,168,106,.25)' : 'rgba(31,163,166,.25)'}`, color: codeCopied ? '#1ea86a' : 'var(--teal)', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'Urbanist, sans-serif', transition: 'all .2s' }}
            >
              {codeCopied ? '✓ Copied!' : 'Copy Code'}
            </button>
          </div>

          {offer.redemptionSteps.length > 0 && (
            <div style={{ textAlign: 'left', background: '#f7f5f2', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>How to Use</div>
              {offer.redemptionSteps.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(31,163,166,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: 'var(--teal)', flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', paddingTop: 2 }}>{s}</div>
                </div>
              ))}
            </div>
          )}

          {pointsEarned > 0 && (
            <div style={{ background: 'rgba(212,175,55,.07)', border: '1px solid rgba(212,175,55,.2)', borderRadius: 12, padding: '10px 16px', fontSize: 12, fontWeight: 700, color: '#b8960f', marginBottom: 16 }}>
              ⭐ +{pointsEarned} points earned!
            </div>
          )}

          <button onClick={onClose} style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'var(--dark)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'Urbanist, sans-serif' }}>Done</button>
        </div>
      </div>
    )
  }

  /* ─────────────── CONCIERGE sent ─────────────── */
  if (step === 'concierge') {
    return (
      <div className="ov2" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        <div className="sheet" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>💬</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--dark)', marginBottom: 8 }}>Request Sent!</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 280, margin: '0 auto 28px' }}>
            Your concierge has been notified and will arrange the <strong>{offer.title}</strong> redemption at {offer.partner.name}.
          </div>
          <button onClick={onClose} style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'var(--dark)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'Urbanist, sans-serif' }}>Done</button>
        </div>
      </div>
    )
  }

  /* ─────────────── ERROR ─────────────── */
  if (step === 'error') {
    return (
      <div className="ov2" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        <div className="sheet" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--dark)', marginBottom: 8 }}>Couldn&apos;t Redeem</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>{errMsg}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '13px', borderRadius: 12, background: '#f7f5f2', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Urbanist, sans-serif', color: 'var(--muted)' }}>Close</button>
            <button onClick={() => setStep('detail')} style={{ flex: 1, padding: '13px', borderRadius: 12, background: 'var(--teal)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Urbanist, sans-serif' }}>Try Again</button>
          </div>
        </div>
      </div>
    )
  }

  /* ─────────────── DETAIL (default) ─────────────── */
  const validToDate = offer.validTo
    ? new Date(offer.validTo).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  const CTA_LABEL: Record<string, string> = {
    SHOW_ON_SCREEN:    'Redeem Now — Show to Staff',
    CODE:              'Get Redemption Code',
    CONCIERGE_CONFIRM: 'Request via Concierge',
  }

  return (
    <div className="ov2" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sheet" style={{ maxHeight: '90dvh', overflowY: 'auto' }}>

        {/* Header */}
        <div className="s-hdr">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 2 }}>
              {icon} {offer.category}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{offer.partner.name}</div>
          </div>
          <button className="s-cls" onClick={onClose}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" stroke="#4a5568" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Image / hero */}
        {offer.imageUrl ? (
          <div style={{ width: '100%', height: 160, borderRadius: 16, backgroundImage: `url(${offer.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: 18 }} />
        ) : (
          <div style={{ width: '100%', height: 120, borderRadius: 16, background: 'linear-gradient(135deg,#1c2a2a,#0f1a1a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, marginBottom: 18 }}>
            {icon}
          </div>
        )}

        <div className="s-ttl" style={{ marginBottom: 8 }}>{offer.title}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.65, marginBottom: 18 }}>{offer.description}</div>

        {/* Meta row */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          {offer.tierEligibility.map(t => (
            <span key={t} style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(31,163,166,.07)', border: '1px solid rgba(31,163,166,.14)', fontSize: 10, fontWeight: 700, color: 'var(--teal)' }}>{t}</span>
          ))}
          {offer.pointsEligible && offer.pointsAward && (
            <span style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(212,175,55,.07)', border: '1px solid rgba(212,175,55,.2)', fontSize: 10, fontWeight: 700, color: '#b8960f' }}>+{offer.pointsAward} pts</span>
          )}
          {validToDate && (
            <span style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(0,0,0,.04)', border: '1px solid rgba(0,0,0,.08)', fontSize: 10, fontWeight: 600, color: 'var(--muted)' }}>Until {validToDate}</span>
          )}
        </div>

        {/* Redemption steps */}
        {offer.redemptionSteps.length > 0 && (
          <div style={{ background: '#f7f5f2', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>How to Redeem</div>
            {offer.redemptionSteps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(31,163,166,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: 'var(--teal)', flexShrink: 0 }}>{i + 1}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', paddingTop: 2 }}>{s}</div>
              </div>
            ))}
          </div>
        )}

        {/* Terms */}
        {offer.termsConditions && (
          <div style={{ fontSize: 11, color: 'rgba(0,0,0,.35)', lineHeight: 1.6, marginBottom: 16 }}>
            <strong style={{ color: 'rgba(0,0,0,.45)' }}>T&Cs: </strong>{offer.termsConditions}
          </div>
        )}

        {/* CTA */}
        <button
          className="ls-btn"
          onClick={handleRedeem}
          disabled={step === 'redeeming'}
          style={{ opacity: step === 'redeeming' ? 0.6 : 1 }}
        >
          {step === 'redeeming' ? 'Processing…' : CTA_LABEL[offer.redemptionType]}
        </button>

      </div>
    </div>
  )
}

'use client'
/**
 * DiningBookSheet — bottom-sheet booking form for a restaurant.
 * Props: restaurant details (pre-filled), onClose callback.
 */

import { useState, FormEvent } from 'react'

interface Restaurant {
  id:           string
  name:         string
  cuisine:      string
  area:         string
  memberBenefit?: string | null
  priceLevel:   number
}

interface Props {
  restaurant: Restaurant
  onClose:    () => void
}

const TIMES = [
  '12:00', '12:30', '13:00', '13:30', '14:00',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
]
const OCCASIONS = ['None', 'Birthday', 'Anniversary', 'Business', 'Date Night', 'Family Dinner', 'Celebration', 'Graduation']
const SEATING   = ['No preference', 'Indoor', 'Outdoor / Terrace', 'Private dining room', 'Bar seating', 'Booth']
const PRICE_LABEL = ['', '₦', '₦₦', '₦₦₦', '₦₦₦₦']

type Step = 'form' | 'confirm' | 'success'

// Minimum date = tomorrow
function minDate() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

export default function DiningBookSheet({ restaurant, onClose }: Props) {
  const [step, setStep]       = useState<Step>('form')
  const [date, setDate]       = useState('')
  const [time, setTime]       = useState('19:30')
  const [party, setParty]     = useState(2)
  const [occasion, setOccasion] = useState('None')
  const [dietary, setDietary] = useState('')
  const [seating, setSeating] = useState('No preference')
  const [contactPref, setContactPref] = useState<'app'|'phone'|'whatsapp'>('app')
  const [notes, setNotes]     = useState('')
  const [busy, setBusy]       = useState(false)
  const [err, setErr]         = useState('')

  const S = {
    label: {
      fontSize: 10, fontWeight: 700, letterSpacing: '1.5px',
      textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 6, display: 'block',
    },
    input: {
      width: '100%', background: '#f7f5f2', border: '1px solid rgba(0,0,0,.08)',
      borderRadius: 12, padding: '11px 14px', color: 'var(--dark)', fontSize: 13,
      fontFamily: 'Urbanist, sans-serif', outline: 'none',
    } as React.CSSProperties,
    pill: (on: boolean): React.CSSProperties => ({
      padding: '7px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer',
      border: on ? '1px solid var(--teal)' : '1px solid rgba(0,0,0,.1)',
      background: on ? 'rgba(31,163,166,.08)' : '#f7f5f2',
      color: on ? 'var(--teal)' : 'var(--muted)', transition: 'all .15s',
      fontFamily: 'Urbanist, sans-serif',
    }),
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!date) { setErr('Please select a date.'); return }
    setErr('')
    setBusy(true)
    try {
      const res = await fetch('/api/dining/book', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId:   restaurant.id,
          preferredDate:  date,
          preferredTime:  time,
          partySize:      party,
          occasion:       occasion !== 'None' ? occasion : undefined,
          dietaryNotes:   dietary  || undefined,
          seatingPref:    seating  !== 'No preference' ? seating : undefined,
          contactPref,
          additionalNotes: notes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Booking failed. Please try again.'); return }
      setStep('success')
    } catch {
      setErr('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ov2" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sheet" style={{ maxHeight: '94dvh', overflowY: 'auto' }}>

        {/* ── SUCCESS ── */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '32px 20px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--dark)', marginBottom: 10 }}>
              Request Sent!
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 280, margin: '0 auto 24px' }}>
              Your concierge will confirm your table at <strong>{restaurant.name}</strong> and reach out within a few hours.
            </div>

            <div style={{ background: '#f7f5f2', borderRadius: 16, padding: '16px', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>Booking Summary</div>
              {[
                ['Restaurant', restaurant.name],
                ['Date', new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })],
                ['Time', time],
                ['Party', `${party} ${party === 1 ? 'guest' : 'guests'}`],
                ...(occasion !== 'None' ? [['Occasion', occasion] as [string,string]] : []),
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{k}</span>
                  <span style={{ fontSize: 12, color: 'var(--dark)', fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>

            <button onClick={onClose} style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'var(--dark)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'Urbanist, sans-serif' }}>
              Done
            </button>
          </div>
        )}

        {/* ── FORM ── */}
        {step !== 'success' && (
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="s-hdr">
              <div>
                <div className="s-ttl">{restaurant.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  {restaurant.cuisine} · {restaurant.area} · {PRICE_LABEL[restaurant.priceLevel]}
                </div>
              </div>
              <button type="button" className="s-cls" onClick={onClose}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                  <path d="M18 6 6 18M6 6l12 12" stroke="#4a5568" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Member benefit */}
            {restaurant.memberBenefit && (
              <div style={{ display: 'flex', gap: 8, background: 'rgba(31,163,166,.06)', border: '1px solid rgba(31,163,166,.14)', borderRadius: 12, padding: '10px 14px', marginBottom: 20 }}>
                <span style={{ color: 'var(--teal)', fontSize: 14 }}>✦</span>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--teal)' }}>{restaurant.memberBenefit}</div>
              </div>
            )}

            {/* Date + Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={S.label}>Date *</label>
                <input type="date" value={date} min={minDate()} onChange={e => setDate(e.target.value)} style={S.input} required />
              </div>
              <div>
                <label style={S.label}>Time *</label>
                <select value={time} onChange={e => setTime(e.target.value)} style={{ ...S.input, appearance: 'none' }}>
                  {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Party size */}
            <div style={{ marginBottom: 18 }}>
              <label style={S.label}>Guests</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button type="button" onClick={() => setParty(p => Math.max(1, p - 1))} style={{ width: 36, height: 36, borderRadius: 10, background: '#f7f5f2', border: '1px solid rgba(0,0,0,.1)', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dark)', fontFamily: 'Urbanist, sans-serif' }}>−</button>
                <div style={{ flex: 1, textAlign: 'center', fontSize: 22, fontWeight: 800, color: 'var(--dark)', fontFamily: "'Cormorant Garamond', serif" }}>
                  {party} <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', fontFamily: 'Urbanist, sans-serif' }}>guests</span>
                </div>
                <button type="button" onClick={() => setParty(p => Math.min(20, p + 1))} style={{ width: 36, height: 36, borderRadius: 10, background: '#f7f5f2', border: '1px solid rgba(0,0,0,.1)', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dark)', fontFamily: 'Urbanist, sans-serif' }}>+</button>
              </div>
            </div>

            {/* Occasion */}
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Occasion</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {OCCASIONS.map(o => (
                  <button key={o} type="button" style={S.pill(occasion === o)} onClick={() => setOccasion(o)}>{o}</button>
                ))}
              </div>
            </div>

            {/* Seating */}
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Seating Preference</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {SEATING.map(s => (
                  <button key={s} type="button" style={S.pill(seating === s)} onClick={() => setSeating(s)}>{s}</button>
                ))}
              </div>
            </div>

            {/* Dietary notes */}
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Dietary Requirements</label>
              <input value={dietary} onChange={e => setDietary(e.target.value)} placeholder="e.g. Vegetarian, nut allergy…" style={S.input} />
            </div>

            {/* Contact preference */}
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Preferred Contact</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['app', 'phone', 'whatsapp'] as const).map(c => (
                  <button key={c} type="button" style={{ ...S.pill(contactPref === c), flex: 1 }} onClick={() => setContactPref(c)}>
                    {c === 'app' ? '📲 In-App' : c === 'phone' ? '📞 Phone' : '💬 WhatsApp'}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional notes */}
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Additional Notes</label>
              <textarea
                value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Anything else we should know?"
                rows={2}
                style={{ ...S.input, resize: 'vertical' }}
              />
            </div>

            {err && (
              <div style={{ padding: '10px 14px', background: 'rgba(255,80,80,.06)', border: '1px solid rgba(255,80,80,.18)', borderRadius: 10, fontSize: 12, color: '#c0392b', marginBottom: 14 }}>
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="ls-btn"
              style={{ opacity: busy ? 0.6 : 1 }}
            >
              {busy ? 'Sending request…' : 'Request Reservation'}
            </button>

            <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--muted)', marginTop: 10, lineHeight: 1.6 }}>
              Your concierge will confirm availability &amp; details within a few hours.
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

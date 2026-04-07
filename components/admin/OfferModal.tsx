'use client'
/**
 * OfferModal — create / edit an offer.
 * Used by /admin/offers page.
 */

import { useState, useEffect, FormEvent } from 'react'

const CATEGORIES = ['DINING', 'WELLNESS', 'NIGHTLIFE', 'EVENTS', 'TRANSPORT', 'SHOPPING', 'STAYS', 'SERVICES'] as const
const REDEMPTION_TYPES = ['SHOW_ON_SCREEN', 'CODE', 'CONCIERGE_CONFIRM'] as const
const TIERS = ['Signature', 'Signature Plus', 'Signature Elite']

type Category = typeof CATEGORIES[number]
type RedemptionType = typeof REDEMPTION_TYPES[number]

interface Partner { id: string; name: string; category: string }

interface OfferData {
  id?: string
  partnerId: string
  title: string
  shortDesc: string
  description: string
  category: Category
  city: string
  area: string
  tierEligibility: string[]
  pointsEligible: boolean
  pointsAward: number | null
  redemptionType: RedemptionType
  redemptionCode: string
  redemptionSteps: string[]
  termsConditions: string
  imageUrl: string
  validFrom: string
  validTo: string
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  isFeatured: boolean
}

const EMPTY: OfferData = {
  partnerId: '', title: '', shortDesc: '', description: '',
  category: 'DINING', city: 'Lagos', area: '', tierEligibility: ['Signature'],
  pointsEligible: false, pointsAward: null, redemptionType: 'SHOW_ON_SCREEN',
  redemptionCode: '', redemptionSteps: [], termsConditions: '',
  imageUrl: '', validFrom: new Date().toISOString().split('T')[0], validTo: '',
  status: 'DRAFT', isFeatured: false,
}

interface Props {
  offer?: OfferData & { id: string }
  partners: Partner[]
  onClose: () => void
  onSaved: () => void
}

export default function OfferModal({ offer, partners, onClose, onSaved }: Props) {
  const isEdit = !!offer?.id
  const [form, setForm] = useState<OfferData>(offer ?? EMPTY)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [stepDraft, setStepDraft] = useState('')

  /* ── Close on Escape ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function set<K extends keyof OfferData>(key: K, val: OfferData[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function toggleTier(tier: string) {
    setForm(f => ({
      ...f,
      tierEligibility: f.tierEligibility.includes(tier)
        ? f.tierEligibility.filter(t => t !== tier)
        : [...f.tierEligibility, tier],
    }))
  }

  function addStep() {
    if (!stepDraft.trim()) return
    setForm(f => ({ ...f, redemptionSteps: [...f.redemptionSteps, stepDraft.trim()] }))
    setStepDraft('')
  }

  function removeStep(i: number) {
    setForm(f => ({ ...f, redemptionSteps: f.redemptionSteps.filter((_, idx) => idx !== i) }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErr('')
    if (!form.partnerId) { setErr('Select a partner.'); return }
    if (!form.tierEligibility.length) { setErr('Select at least one tier.'); return }

    setBusy(true)
    try {
      const url    = isEdit ? `/api/admin/offers/${offer!.id}` : '/api/admin/offers'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          pointsAward:  form.pointsEligible ? form.pointsAward : null,
          validTo:      form.validTo || null,
          redemptionCode: form.redemptionCode || null,
          imageUrl:     form.imageUrl || null,
          area:         form.area || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Error saving offer.'); return }
      onSaved()
    } catch {
      setErr('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  /* ── Styles ── */
  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 9000,
    background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    padding: '24px 12px', overflowY: 'auto',
  }
  const sheet: React.CSSProperties = {
    background: '#111e1e', border: '1px solid rgba(31,163,166,.18)',
    borderRadius: 20, width: '100%', maxWidth: 640,
    padding: '28px 28px 32px', position: 'relative',
  }
  const label: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase',
    color: 'rgba(201,206,214,.4)', marginBottom: 6, display: 'block',
  }
  const input: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,.05)',
    border: '1px solid rgba(201,206,214,.12)', borderRadius: 10,
    padding: '10px 14px', color: 'var(--cream)', fontSize: 13,
    fontFamily: 'Urbanist, sans-serif', outline: 'none',
  }
  const row: React.CSSProperties = { display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }
  const pill = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer',
    border: active ? '1px solid var(--teal)' : '1px solid rgba(201,206,214,.12)',
    background: active ? 'rgba(31,163,166,.12)' : 'transparent',
    color: active ? 'var(--teal)' : 'rgba(201,206,214,.45)',
    transition: 'all .15s',
  })

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={sheet}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 4 }}>
              {isEdit ? 'Edit Offer' : 'New Offer'}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--cream)' }}>
              {isEdit ? form.title || 'Edit Offer' : 'Create Offer'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(201,206,214,.07)', border: 'none', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', color: 'rgba(201,206,214,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}
          >×</button>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Partner + Category row */}
          <div style={row}>
            <div>
              <label style={label}>Partner *</label>
              <select value={form.partnerId} onChange={e => set('partnerId', e.target.value)} style={{ ...input, appearance: 'none' }} required>
                <option value="">Select partner…</option>
                {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Category *</label>
              <select value={form.category} onChange={e => set('category', e.target.value as Category)} style={{ ...input, appearance: 'none' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Title */}
          <div style={{ marginTop: 16 }}>
            <label style={label}>Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. 20% off à la carte dining" style={input} required />
          </div>

          {/* Short description */}
          <div style={{ marginTop: 16 }}>
            <label style={label}>Short Description <span style={{ color: 'rgba(201,206,214,.25)' }}>(max 120)</span></label>
            <input value={form.shortDesc} onChange={e => set('shortDesc', e.target.value)} maxLength={120} placeholder="Displayed in offer cards…" style={input} />
          </div>

          {/* Full description */}
          <div style={{ marginTop: 16 }}>
            <label style={label}>Full Description *</label>
            <textarea
              value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Full offer details…" rows={3} required
              style={{ ...input, resize: 'vertical' }}
            />
          </div>

          {/* City + Area */}
          <div style={{ ...row, marginTop: 16 }}>
            <div>
              <label style={label}>City</label>
              <input value={form.city} onChange={e => set('city', e.target.value)} style={input} />
            </div>
            <div>
              <label style={label}>Area / Neighbourhood</label>
              <input value={form.area} onChange={e => set('area', e.target.value)} placeholder="e.g. Victoria Island" style={input} />
            </div>
          </div>

          {/* Tier Eligibility */}
          <div style={{ marginTop: 20 }}>
            <label style={label}>Tier Eligibility *</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TIERS.map(t => (
                <button key={t} type="button" style={pill(form.tierEligibility.includes(t))} onClick={() => toggleTier(t)}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Valid dates */}
          <div style={{ ...row, marginTop: 20 }}>
            <div>
              <label style={label}>Valid From *</label>
              <input type="date" value={form.validFrom} onChange={e => set('validFrom', e.target.value)} style={input} required />
            </div>
            <div>
              <label style={label}>Valid To <span style={{ color: 'rgba(201,206,214,.25)' }}>(leave blank = ongoing)</span></label>
              <input type="date" value={form.validTo} onChange={e => set('validTo', e.target.value)} style={input} />
            </div>
          </div>

          {/* Redemption */}
          <div style={{ marginTop: 20 }}>
            <label style={label}>Redemption Type</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {REDEMPTION_TYPES.map(rt => (
                <button key={rt} type="button" style={pill(form.redemptionType === rt)} onClick={() => set('redemptionType', rt)}>
                  {rt.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {form.redemptionType === 'CODE' && (
            <div style={{ marginTop: 12 }}>
              <label style={label}>Redemption Code</label>
              <input value={form.redemptionCode} onChange={e => set('redemptionCode', e.target.value)} placeholder="NSL2025VIP" style={input} />
            </div>
          )}

          {/* Redemption Steps */}
          <div style={{ marginTop: 16 }}>
            <label style={label}>Redemption Steps</label>
            {form.redemptionSteps.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,.04)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--cream)' }}>
                  {i + 1}. {s}
                </div>
                <button type="button" onClick={() => removeStep(i)} style={{ background: 'rgba(255,80,80,.1)', border: 'none', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', color: 'rgba(255,110,110,.8)', fontSize: 14 }}>×</button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <input
                value={stepDraft} onChange={e => setStepDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addStep() } }}
                placeholder="Add a redemption step…" style={{ ...input, flex: 1 }}
              />
              <button type="button" onClick={addStep} style={{ background: 'rgba(31,163,166,.12)', border: '1px solid rgba(31,163,166,.25)', borderRadius: 10, padding: '0 16px', color: 'var(--teal)', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add</button>
            </div>
          </div>

          {/* Points */}
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
              <div
                onClick={() => set('pointsEligible', !form.pointsEligible)}
                style={{ width: 20, height: 20, borderRadius: 6, border: form.pointsEligible ? '1px solid var(--teal)' : '1px solid rgba(201,206,214,.2)', background: form.pointsEligible ? 'var(--teal)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .15s' }}
              >
                {form.pointsEligible && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(201,206,214,.7)' }}>Points eligible</span>
            </label>
            {form.pointsEligible && (
              <input
                type="number" min={0} value={form.pointsAward ?? ''}
                onChange={e => set('pointsAward', parseInt(e.target.value) || 0)}
                placeholder="Points awarded" style={{ ...input, width: 160 }}
              />
            )}
          </div>

          {/* Image URL */}
          <div style={{ marginTop: 16 }}>
            <label style={label}>Image URL</label>
            <input value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} placeholder="https://…" style={input} />
          </div>

          {/* Terms */}
          <div style={{ marginTop: 16 }}>
            <label style={label}>Terms & Conditions</label>
            <textarea
              value={form.termsConditions} onChange={e => set('termsConditions', e.target.value)}
              placeholder="e.g. Valid Mon–Fri only, not combinable with other offers…" rows={2}
              style={{ ...input, resize: 'vertical' }}
            />
          </div>

          {/* Status + Featured */}
          <div style={{ ...row, marginTop: 20 }}>
            <div>
              <label style={label}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value as OfferData['status'])} style={{ ...input, appearance: 'none' }}>
                {['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 24 }}>
              <div
                onClick={() => set('isFeatured', !form.isFeatured)}
                style={{ width: 20, height: 20, borderRadius: 6, border: form.isFeatured ? '1px solid var(--gold)' : '1px solid rgba(201,206,214,.2)', background: form.isFeatured ? 'rgba(212,175,55,.2)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .15s', flexShrink: 0 }}
              >
                {form.isFeatured && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"/></svg>}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(201,206,214,.7)' }}>Feature on home screen</span>
            </div>
          </div>

          {/* Error */}
          {err && (
            <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(255,80,80,.08)', border: '1px solid rgba(255,80,80,.2)', borderRadius: 10, fontSize: 12, color: 'rgba(255,110,110,.9)' }}>
              {err}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button
              type="button" onClick={onClose}
              style={{ flex: 1, padding: '13px', borderRadius: 12, background: 'rgba(201,206,214,.06)', border: '1px solid rgba(201,206,214,.12)', color: 'rgba(201,206,214,.6)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Urbanist, sans-serif' }}
            >
              Cancel
            </button>
            <button
              type="submit" disabled={busy}
              style={{ flex: 2, padding: '13px', borderRadius: 12, background: busy ? 'rgba(31,163,166,.4)' : 'var(--teal)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'Urbanist, sans-serif', transition: 'background .2s' }}
            >
              {busy ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
